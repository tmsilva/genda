import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const TIMEZONE = 'America/Sao_Paulo';
dayjs.tz.setDefault(TIMEZONE);
dayjs.locale('pt-br');

/** Returns current time in America/Sao_Paulo */
export const now = () => dayjs.tz();

/** Parses a date in America/Sao_Paulo timezone */
export const parseDate = (date?: string | number | Date | dayjs.Dayjs) => dayjs.tz(date);

/** Returns YYYY-MM-DD of current day in Sao_Paulo */
export const getTodayStr = () => now().format('YYYY-MM-DD');

/** Format a date string into pt-BR */
export const formatDatePtBR = (dateStr: string) => parseDate(dateStr).format('DD/MM/YYYY');
