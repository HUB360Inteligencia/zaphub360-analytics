import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavbarProps, useNavigation } from "react-day-picker";

export function CalendarNavbar(_props: NavbarProps) {
  const { goToMonth, nextMonth, previousMonth, displayMonths } = useNavigation();
  const current = displayMonths?.[0] ?? new Date();

  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(current);

  return (
    <div className="w-full grid grid-cols-[auto_1fr_auto] items-center px-2 py-1">
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="justify-self-start inline-flex h-7 w-7 items-center justify-center rounded-md border border-border p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="text-center text-sm font-medium leading-none">
        {label}
      </div>

      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className="justify-self-end inline-flex h-7 w-7 items-center justify-center rounded-md border border-border p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

