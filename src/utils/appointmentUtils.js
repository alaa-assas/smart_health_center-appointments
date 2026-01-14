/*
  this alogaritm for appointment logic
 */

class AppointmentUtils {
  static APPOINTMENT_DURATION = 30;

  static timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  static minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  // cheack the time conflict
  static isTimeConflict(slot1, slot2) {
    const start1 = this.timeToMinutes(slot1.start);
    const end1 = this.timeToMinutes(slot1.end);
    const start2 = this.timeToMinutes(slot2.start);
    const end2 = this.timeToMinutes(slot2.end);

    return start1 < end2 && end1 > start2;
  }

  // create appointment with 30 mintues betwen it
  static generateSlots(startTime, endTime) {
    const slots = [];
    let currentStart = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    while (currentStart + this.APPOINTMENT_DURATION <= end) {
      const slotEnd = currentStart + this.APPOINTMENT_DURATION;
      slots.push({
        start: this.minutesToTime(currentStart),
        end: this.minutesToTime(slotEnd),
      });
      currentStart = slotEnd;
    }

    return slots;
  }

  // cheack the appointment in feauter
  static isFutureAppointment(date, timeStr) {
    const now = new Date();
    const appointmentTime = new Date(
      `${date.toISOString().split("T")[0]}T${timeStr}`
    );
    return appointmentTime > now;
  }

  // get the day start
  static startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // get the end of day
  static endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}

module.exports = AppointmentUtils;
