
import React, { useState } from 'react';
import { Button, Table } from 'react-bootstrap';

interface CalendarPickerProps {
    startDate: string;
    onDateChange: (date: string) => void;
    existingBookings: Array<{ startDate: string; endDate: string }>;
    maxAdvanceDays?: number;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
    startDate,
    onDateChange,
    existingBookings,
    maxAdvanceDays = 14
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Helper to get YYYY-MM-DD in local time
    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const bookedDates = new Set<string>();
    existingBookings.forEach(booking => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            bookedDates.add(toDateString(d));
        }
    });

    const generateDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const isBooked = (date: Date) => {
        return bookedDates.has(toDateString(date));
    };

    const isPast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const isTooFar = (date: Date) => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
        maxDate.setHours(23, 59, 59, 999);
        return date > maxDate;
    };

    const isSelected = (date: Date) => {
        return toDateString(date) === startDate;
    };


    const handleMonthChange = (offset: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        setCurrentMonth(newMonth);
    };

    const days = generateDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return (
        <div className="calendar-picker border rounded-3 p-3 bg-white shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button variant="link" size="sm" onClick={() => handleMonthChange(-1)}>
                    <i className="bi bi-chevron-left text-primary"></i>
                </Button>
                <span className="fw-bold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <Button variant="link" size="sm" onClick={() => handleMonthChange(1)}>
                    <i className="bi bi-chevron-right text-primary"></i>
                </Button>
            </div>

            <Table borderless size="sm" className="text-center mb-0">
                <thead>
                    <tr>
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                            <th key={d} className="small text-muted fw-normal pb-2" style={{ width: '14.28%' }}>{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {weeks.map((week, widx) => (
                        <tr key={widx}>
                            {week.map((day, didx) => {
                                if (!day) return <td key={didx}></td>;

                                const booked = isBooked(day);
                                const past = isPast(day);
                                const tooFar = isTooFar(day);
                                const selected = isSelected(day);
                                const disabled = booked || past || tooFar;

                                const getCellClass = () => {
                                    if (selected) return 'bg-primary text-white rounded-circle shadow-sm';
                                    if (booked) return 'bg-warning bg-opacity-75 text-white rounded-circle';
                                    if (past || tooFar) return 'text-muted opacity-25';
                                    return 'hover-bg-light rounded-circle cursor-pointer';
                                };

                                return (
                                    <td key={didx} className="p-1">
                                        <div
                                            className={`d-flex align-items-center justify-content-center m-auto`}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                fontSize: '0.9rem',
                                                cursor: disabled ? 'default' : 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            <div
                                                className={`w-100 h-100 d-flex align-items-center justify-content-center ${getCellClass()}`}
                                                onClick={() => !disabled && onDateChange(toDateString(day))}
                                            >
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </Table>

            <div className="mt-3 pt-3 border-top d-flex gap-3 justify-content-center x-small text-muted">
                <div className="d-flex align-items-center">
                    <span className="d-inline-block rounded-circle bg-warning me-1" style={{ width: '8px', height: '8px' }}></span>
                    <span>จองแล้ว</span>
                </div>
                <div className="d-flex align-items-center">
                    <span className="d-inline-block rounded-circle bg-primary me-1" style={{ width: '8px', height: '8px' }}></span>
                    <span>ที่เลือก</span>
                </div>
                <div className="d-flex align-items-center">
                    <span className="d-inline-block rounded-circle bg-light border me-1" style={{ width: '8px', height: '8px' }}></span>
                    <span>เลือกได้</span>
                </div>
            </div>

            <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
          color: var(--bs-primary);
        }
        .x-small {
          font-size: 0.75rem;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
        </div>
    );
};

export default CalendarPicker;
