import * as React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  value?: Date
  onChange?: (date: Date | null) => void
  className?: string
  showOutsideDays?: boolean
}

function Calendar({
  value,
  onChange,
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("", className)}>
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        inline
        calendarClassName="rounded-md border shadow-sm"
        wrapperClassName="w-full"
        dateFormat="MMMM d, yyyy"
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
