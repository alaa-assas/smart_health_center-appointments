/*
  this alogaritm for appointment logic
 */

class AppointmentUtils {
  static APPOINTMENT_DURATION = 30;

  /**
   * @desc    Convert time string (HH:mm) to total minutes
   *
   * @param   {String} timeStr - Time in HH:mm format
   * @returns {Number} Total minutes since 00:00
   *
   * @example
   * timeToMinutes("09:30") // 570
   */
  static timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * @desc    Convert total minutes to time string (HH:mm)
   *
   * @param   {Number} totalMinutes - Total minutes since 00:00
   * @returns {String} Time in HH:mm format
   *
   * @example
   * minutesToTime(570) // "09:30"
   */
  static minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * @desc    Check if two time slots overlap
   *
   * @param   {Object} slot1 - First time slot
   * @param   {String} slot1.start - Start time (HH:mm)
   * @param   {String} slot1.end - End time (HH:mm)
   * @param   {Object} slot2 - Second time slot
   * @param   {String} slot2.start - Start time (HH:mm)
   * @param   {String} slot2.end - End time (HH:mm)
   *
   * @returns {Boolean} True if slots overlap, otherwise false
   *
   * @example
   * isTimeConflict(
   *   { start: "10:00", end: "10:30" },
   *   { start: "10:15", end: "10:45" }
   * ) // true
   */
  static isTimeConflict(slot1, slot2) {
    const start1 = this.timeToMinutes(slot1.start);
    const end1 = this.timeToMinutes(slot1.end);
    const start2 = this.timeToMinutes(slot2.start);
    const end2 = this.timeToMinutes(slot2.end);

    return start1 < end2 && end1 > start2;
  }

  /**
   * @desc    Generate appointment time slots with fixed duration
   *
   * This method creates sequential appointment slots
   * between a start and end time using a predefined duration.
   *
   * @param   {String} startTime - Start time (HH:mm)
   * @param   {String} endTime - End time (HH:mm)
   *
   * @returns {Array<Object>} List of generated time slots
   *
   * @example
   * generateSlots("09:00", "11:00")
   * // [
   * //   { start: "09:00", end: "09:30" },
   * //   { start: "09:30", end: "10:00" }
   * // ]
   */
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

  /**
   * @desc    Check whether an appointment time is in the future
   *
   * @param   {Date} date - Appointment date
   * @param   {String} timeStr - Appointment time (HH:mm)
   *
   * @returns {Boolean} True if appointment is in the future
   */
  static isFutureAppointment(date, timeStr) {
    const now = new Date();
    const appointmentTime = new Date(
      `${date.toISOString().split("T")[0]}T${timeStr}`
    );
    return appointmentTime > now;
  }

  /**
   * @desc    Get the start of a given day
   *
   * @param   {Date} date
   * @returns {Date} Date set to 00:00:00.000
   */
  static startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * @desc    Get the end of a given day
   *
   * @param   {Date} date
   * @returns {Date} Date set to 23:59:59.999
   */
  static endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}

module.exports = AppointmentUtils;
