import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserSearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function UserSearchInput({ value, onChange }: UserSearchInputProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("users.search_placeholder", "Search users...")}
        className="pl-9"
      />
    </div>
  );
}
