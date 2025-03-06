'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '../../../../components/ui/button';
import { Calendar } from '../../../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import { cn } from '../../../../lib/utils';

interface DatePickerFieldProps {
  value: string | null;
  onUpdate: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerField({
  value,
  onUpdate,
  placeholder = 'Select date',
  disabled = false,
}: DatePickerFieldProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      // Use ISO string for consistent date format in your database
      onUpdate(newDate.toISOString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
