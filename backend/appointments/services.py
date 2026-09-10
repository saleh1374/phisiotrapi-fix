"""Slot generation and concurrency-safe booking for appointments."""
import datetime
import logging
import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Appointment, DoctorSchedule, Holiday

logger = logging.getLogger(__name__)

MIN_BOOKING_LEAD_HOURS = 2


def _today_local() -> datetime.date:
    return timezone.localdate()


def _minutes(t: datetime.time) -> int:
    return t.hour * 60 + t.minute


def _time_from_minutes(m: int) -> datetime.time:
    return (datetime.datetime(2000, 1, 1) + datetime.timedelta(minutes=m)).time()


def _persian_weekday(date: datetime.date) -> int:
    """Convert a Python date to the Persian weekday used by DoctorSchedule.

    DoctorSchedule uses: 0=Saturday, 1=Sunday, ..., 6=Friday (Iranian calendar).
    Python's weekday(): 0=Monday, 1=Tuesday, ..., 6=Sunday.

    Mapping: Saturday=5 → 0, Sunday=6 → 1, Monday=0 → 2, ...
    Formula: (python_weekday + 2) % 7
    """
    return (date.weekday() + 2) % 7


def iter_slot_times(schedule: DoctorSchedule) -> list[tuple[datetime.time, datetime.time]]:
    """Generate (start, end) slot pairs for a schedule, respecting the break."""
    start = _minutes(schedule.start_work)
    end = _minutes(schedule.end_work)
    duration = schedule.session_duration
    break_start = _minutes(schedule.break_start) if schedule.break_start else None
    break_end = _minutes(schedule.break_end) if schedule.break_end else None

    slots = []
    t = start
    while t + duration <= end:
        # Skip slots overlapping the break window.
        if break_start is not None and break_end is not None:
            if t < break_end and t + duration > break_start:
                t = break_end
                continue
        slots.append((_time_from_minutes(t), _time_from_minutes(t + duration)))
        t += duration
    return slots


def free_slots(doctor_id: uuid.UUID, date: datetime.date) -> list[dict]:
    """Return free time slots for a doctor on a given date."""
    date = date or _today_local()
    schedules = list(DoctorSchedule.objects.filter(doctor_id=doctor_id, day_of_week=_persian_weekday(date)))
    if not schedules:
        return []

    is_holiday = Holiday.objects.filter(date=date).filter(models_or_doctor(doctor_id)).exists()
    if is_holiday:
        return []

    booked = set(
        Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=date,
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
        ).values_list("start_time", flat=True)
    )

    return _build_free_slots(schedules, booked)


def _build_free_slots(schedules: list, booked: set) -> list[dict]:
    """Build free slot list from schedule objects and booked times."""
    result = []
    for schedule in schedules:
        for start, end in iter_slot_times(schedule):
            if start not in booked:
                result.append(
                    {
                        "start": start.strftime("%H:%M"),
                        "end": end.strftime("%H:%M"),
                    }
                )
    result.sort(key=lambda s: s["start"])
    return result


def available_days(doctor_id: uuid.UUID, days: int = 30) -> list[dict]:
    """List the next `days` days with their free-slot counts (for the Jalali calendar).

    Optimized: batch-loads all schedules and holidays upfront to avoid N+1 queries.
    """
    today = _today_local()
    dates = [today + datetime.timedelta(days=offset) for offset in range(days)]

    # Batch-load all schedules for this doctor (typically 1-7 rows)
    all_schedules = list(
        DoctorSchedule.objects.filter(doctor_id=doctor_id)
    )
    schedule_by_weekday: dict[int, list] = {}
    for s in all_schedules:
        schedule_by_weekday.setdefault(s.day_of_week, []).append(s)

    # Batch-load holidays for the date range
    holidays = set(
        Holiday.objects.filter(
            date__gte=today,
            date__lt=today + datetime.timedelta(days=days),
        ).filter(models_or_doctor(doctor_id)).values_list("date", flat=True)
    )

    # Batch-load all booked appointments in the date range
    booked_by_date: dict[datetime.date, set] = {}
    for appt in Appointment.objects.filter(
        doctor_id=doctor_id,
        appointment_date__gte=today,
        appointment_date__lt=today + datetime.timedelta(days=days),
        status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
    ).values("appointment_date", "start_time"):
        booked_by_date.setdefault(appt["appointment_date"], set()).add(appt["start_time"])

    out = []
    for date in dates:
        if date in holidays:
            continue
        pw = _persian_weekday(date)
        schedules = schedule_by_weekday.get(pw, [])
        if not schedules:
            continue
        booked = booked_by_date.get(date, set())
        free = _build_free_slots(schedules, booked)
        if free:
            out.append({"date": date.isoformat(), "free_slots": len(free)})
    return out


def book_appointment(
    *,
    patient_id: uuid.UUID,
    doctor_id: uuid.UUID,
    service_type: str,
    date: datetime.date,
    start_time: str,
    description: str = "",
) -> Appointment:
    """Book an appointment inside a transaction with a row-level lock.

    Concurrency strategy:
      1. Lock the doctor's schedule rows with select_for_update, serializing
         all bookings for the same doctor (PostgreSQL honours FOR UPDATE).
      2. Re-check availability inside the lock using the locked data directly.
      3. Insert; a UNIQUE constraint on (doctor, date, start_time) for active
         statuses acts as a final backstop against races.
    Raises ValueError with a Persian message on any conflict.
    """
    if date < _today_local():
        raise ValueError("امکان رزرو نوبت در تاریخ گذشته وجود ندارد")

    # Minimum 2-hour lead time before the appointment (spec).
    now = timezone.localtime()
    slot_datetime = datetime.datetime.combine(date, datetime.time.fromisoformat(start_time))
    slot_datetime = timezone.make_aware(slot_datetime)
    if slot_datetime - now < datetime.timedelta(hours=MIN_BOOKING_LEAD_HOURS):
        raise ValueError(f"حداقل {MIN_BOOKING_LEAD_HOURS} ساعت قبل از نوبت باید رزرو کنید")

    try:
        with transaction.atomic():
            # Step 1: Lock schedule rows to serialize concurrent bookings.
            schedules = list(
                DoctorSchedule.objects.select_for_update().filter(
                    doctor_id=doctor_id, day_of_week=_persian_weekday(date)
                )
            )
            if not schedules:
                raise ValueError("این پزشک در تاریخ مورد نظر نوبت خالی ندارد. لطفاً تاریخ یا پزشک دیگری انتخاب کنید")

            is_holiday = Holiday.objects.filter(date=date).filter(
                models_or_doctor(doctor_id)
            ).exists()
            if is_holiday:
                raise ValueError("این تاریخ تعطیل است")

            # Step 2: Re-check availability INSIDE the lock using locked data.
            booked = set(
                Appointment.objects.filter(
                    doctor_id=doctor_id,
                    appointment_date=date,
                    status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
                ).values_list("start_time", flat=True)
            )
            free = {s["start"] for s in _build_free_slots(schedules, booked)}
            if start_time not in free:
                raise ValueError("متاسفانه این زمان پر شد؛ لطفاً زمان دیگری انتخاب کنید")

            duration = schedules[0].session_duration
            end = (
                datetime.datetime.combine(date, datetime.time.fromisoformat(start_time))
                + datetime.timedelta(minutes=duration)
            ).time()

            appointment = Appointment.objects.create(
                patient_id=patient_id,
                doctor_id=doctor_id,
                service_type=service_type,
                appointment_date=date,
                start_time=start_time,
                end_time=end,
                description=description,
            )
        logger.info("Appointment booked: %s for patient %s with doctor %s on %s %s", appointment.id, patient_id, doctor_id, date, start_time)
        return appointment
    except IntegrityError:
        raise ValueError("متاسفانه این زمان پر شد؛ لطفاً زمان دیگری انتخاب کنید")


def models_or_doctor(doctor_id):
    from django.db.models import Q

    return Q(doctor_id=doctor_id) | Q(doctor__isnull=True)
