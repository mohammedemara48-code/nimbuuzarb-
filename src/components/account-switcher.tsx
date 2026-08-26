import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import {
  listSavedAccounts,
  removeSavedAccount,
  type SavedAccount,
} from "@/lib/chat/accounts";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccountSwitcher({
  user,
  onClose,
}: {
  user: { id: string; displayName?: string | null; primaryEmail?: string | null; profileImageUrl?: string | null };
  onClose?: () => void;
}) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    setAccounts(listSavedAccounts());
  }, []);

  const goLogin = (path: string) => {
    if (!user.id) {
      window.location.href = path;
      return;
    }
    void signOut(path);
  };

  const switchTo = (account: SavedAccount) => {
    if (account.id === user.id) {
      onClose?.();
      return;
    }
    goLogin(`/login?account=${encodeURIComponent(account.email || account.name)}`);
  };

  const addAccount = () => {
    goLogin("/login?add=1");
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {accounts.map((account) => {
          const current = account.id === user.id;
          return (
            <li key={account.id}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => switchTo(account)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-start"
                >
                  <Avatar src={account.image} name={account.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {account.name}
                    </span>
                    <span className="block truncate text-xs text-muted">{account.email}</span>
                  </span>
                  {current && <Check className="size-4 shrink-0 text-primary" />}
                </button>
                {!current && (
                  <button
                    type="button"
                    aria-label="حذف الحساب من القائمة"
                    className="grid size-9 place-items-center rounded-md text-muted hover:bg-bg hover:text-danger"
                    onClick={() => {
                      removeSavedAccount(account.id);
                      setAccounts(listSavedAccounts());
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" className="w-full" onClick={addAccount}>
        <Plus className="size-4" />
        إضافة حساب
      </Button>
    </div>
  );
}

export function SavedAccountPicker({
  onChoose,
}: {
  onChoose: (account: SavedAccount) => void;
}) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  useEffect(() => {
    setAccounts(listSavedAccounts());
  }, []);
  if (accounts.length === 0) return null;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {accounts.map((account) => (
        <li key={account.id}>
          <button
            type="button"
            onClick={() => onChoose(account)}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-3 text-start hover:bg-bg",
            )}
          >
            <Avatar src={account.image} name={account.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{account.name}</span>
              <span className="block truncate text-xs text-muted">{account.email}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
