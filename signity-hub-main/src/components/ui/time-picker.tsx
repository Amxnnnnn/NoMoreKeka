import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TimePickerProps {
  time?: string; // Format: "HH:mm"
  onTimeChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format24h?: boolean;
}

const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ time, onTimeChange, placeholder = "Select time", disabled, className, format24h = true }, ref) => {
    const [hours, setHours] = React.useState(time ? time.split(':')[0] : '');
    const [minutes, setMinutes] = React.useState(time ? time.split(':')[1] : '');
    const [period, setPeriod] = React.useState<'AM' | 'PM'>('AM');

    React.useEffect(() => {
      if (time) {
        const [h, m] = time.split(':');
        if (format24h) {
          setHours(h);
          setMinutes(m);
        } else {
          const hour24 = parseInt(h);
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          setHours(hour12.toString().padStart(2, '0'));
          setMinutes(m);
          setPeriod(hour24 >= 12 ? 'PM' : 'AM');
        }
      }
    }, [time, format24h]);

    const handleTimeChange = () => {
      if (hours && minutes) {
        let finalHours = hours;
        if (!format24h) {
          const hour12 = parseInt(hours);
          if (period === 'PM' && hour12 !== 12) {
            finalHours = (hour12 + 12).toString();
          } else if (period === 'AM' && hour12 === 12) {
            finalHours = '00';
          }
        }
        const timeString = `${finalHours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        onTimeChange?.(timeString);
      }
    };

    React.useEffect(() => {
      handleTimeChange();
    }, [hours, minutes, period]);

    const formatDisplayTime = () => {
      if (!time) return placeholder;
      if (format24h) return time;
      
      const [h, m] = time.split(':');
      const hour24 = parseInt(h);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${m} ${period}`;
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !time && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {formatDisplayTime()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex items-center space-x-2">
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: format24h ? 24 : 12 }, (_, i) => {
                  const hour = format24h ? i : i + 1;
                  return (
                    <SelectItem key={hour} value={hour.toString().padStart(2, '0')}>
                      {hour.toString().padStart(2, '0')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <span className="text-muted-foreground">:</span>
            
            <Select value={minutes} onValueChange={setMinutes}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => (
                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!format24h && (
              <Select value={period} onValueChange={(value: 'AM' | 'PM') => setPeriod(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
TimePicker.displayName = "TimePicker";

export { TimePicker };