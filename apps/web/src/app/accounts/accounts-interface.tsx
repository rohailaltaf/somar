"use client";

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { useAccountMutations } from "@somar/shared/hooks";
import { usePlaidSync } from "@/hooks/use-plaid-sync";
import { motion } from "framer-motion";
import type {
  Account,
  AccountType,
  PlaidAccountInfo,
  PlaidItemWithAccounts,
} from "@somar/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Link2,
  RefreshCw,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Settings2,
  Plus,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { PlaidSyncModal } from "@/components/plaid-sync-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Custom easing
const smoothEase = [0.16, 1, 0.3, 1] as const;

// Separate component to isolate the usePlaidLink hook - only mounts when token exists
function PlaidLinkLauncher({
  token,
  onSuccess,
  onExit,
}: {
  token: string;
  onSuccess: PlaidLinkOnSuccess;
  onExit: () => void;
}) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (ready) {
      open();
    }
  }, [ready, open]);

  return null;
}

interface AccountsInterfaceProps {
  accounts: Account[];
  plaidItems: PlaidItemWithAccounts[];
}

export function AccountsInterface({ accounts, plaidItems }: AccountsInterfaceProps) {
  const { createAccount, updateAccount, deleteAccount } = useAccountMutations();
  const { syncItem: plaidSyncItem } = usePlaidSync();
  const queryClient = useQueryClient();

  // State for account management
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("checking");

  // State for manual account creation
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("checking");

  // State for Plaid connection (unified for both new connection and update mode)
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());
  const [disconnectingItem, setDisconnectingItem] = useState<PlaidItemWithAccounts | null>(null);
  const [deleteTransactions, setDeleteTransactions] = useState(false);

  // State for update mode (managing accounts) - uses shared linkToken
  const [updateModeItemId, setUpdateModeItemId] = useState<string | null>(null);
  const [isUpdatingAccounts, setIsUpdatingAccounts] = useState(false);

  // State for sync modal
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncModalInstitution, setSyncModalInstitution] = useState("");
  const [pendingSyncItemId, setPendingSyncItemId] = useState<string | null>(null);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["plaidItems"] });
  }, [queryClient]);

  // Separate accounts into connected and manual
  const connectedAccounts = accounts.filter((a) => a.plaidAccountId);
  const manualAccounts = accounts.filter((a) => !a.plaidAccountId);

  // ========== Manual Account Handlers ==========

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    createAccount.mutate(
      { name: newAccountName.trim(), type: newAccountType },
      {
        onSuccess: () => {
          toast.success("Account created");
          setShowCreateDialog(false);
          setNewAccountName("");
          setNewAccountType("checking");
        },
        onError: () => {
          toast.error("Failed to create account");
        },
      }
    );
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditType(account.type as AccountType);
  };

  const handleSaveEdit = () => {
    if (!editingAccount || !editName.trim()) return;

    updateAccount.mutate(
      { id: editingAccount.id, name: editName.trim(), type: editType },
      {
        onSuccess: () => {
          setEditingAccount(null);
          toast.success("Account updated");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingAccount) return;

    deleteAccount.mutate(deletingAccount.id, {
      onSuccess: () => {
        setDeletingAccount(null);
        toast.success("Account deleted");
      },
    });
  };

  // ========== Plaid Connection Handlers ==========

  const fetchLinkToken = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        setIsConnecting(false);
        return;
      }

      setLinkToken(data.linkToken);
    } catch {
      toast.error("Failed to initialize connection");
      setIsConnecting(false);
    }
  };

  // Unified onSuccess handler for both new connection and update mode
  const onSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      // Check if we're in update mode (managing accounts for existing connection)
      if (updateModeItemId) {
        try {
          const response = await fetch(`/api/plaid/items/${updateModeItemId}/accounts`, {
            method: "POST",
          });
          const result = await response.json();

          if (result.success) {
            if (result.data?.added > 0) {
              toast.success(
                `Added ${result.data.added} new account(s)! Total: ${result.data.total} accounts.`
              );
            } else {
              toast.info("Account selection updated. No new accounts added.");
            }
            invalidateQueries();
          } else {
            toast.error(result.error?.message || "Failed to update accounts");
          }
        } catch {
          toast.error("Failed to update accounts");
        } finally {
          setIsUpdatingAccounts(false);
          setUpdateModeItemId(null);
          setLinkToken(null);
        }
        return;
      }

      // New connection flow
      try {
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            institutionId: metadata.institution?.institution_id || "",
            institutionName: metadata.institution?.name || "Unknown Institution",
          }),
        });

        const data = await response.json();

        if (data.error) {
          toast.error(data.error);
          setIsConnecting(false);
          setLinkToken(null);
          return;
        }

        // Create accounts in database
        const accountsToCreate = data.accounts as PlaidAccountInfo[];
        for (const account of accountsToCreate) {
          await createAccount.mutateAsync({
            name: account.name,
            type: account.type,
            plaidAccountId: account.plaidAccountId,
          });
        }

        // Show sync modal immediately (queries invalidated after modal completes)
        if (data.itemId) {
          setSyncModalInstitution(metadata.institution?.name || "your bank");
          setPendingSyncItemId(data.itemId);
          setSyncModalOpen(true);
        } else {
          invalidateQueries();
        }
      } catch {
        toast.error("Failed to connect institution");
      } finally {
        setIsConnecting(false);
        setLinkToken(null);
      }
    },
    [invalidateQueries, createAccount, updateModeItemId]
  );

  const handlePlaidExit = useCallback(() => {
    setIsConnecting(false);
    setIsUpdatingAccounts(false);
    setUpdateModeItemId(null);
    setLinkToken(null);
  }, []);

  // Handle sync modal completion
  const handleSyncModalComplete = useCallback(() => {
    setSyncModalOpen(false);
    setPendingSyncItemId(null);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    invalidateQueries();
  }, [queryClient, invalidateQueries]);

  // Sync function for the modal
  const performModalSync = useCallback(async () => {
    if (!pendingSyncItemId) {
      return { added: 0, errors: ["No item to sync"] };
    }
    return plaidSyncItem(pendingSyncItemId);
  }, [pendingSyncItemId, plaidSyncItem]);

  const handleSync = async (itemId: string) => {
    setSyncingItems((prev) => new Set(prev).add(itemId));

    try {
      const result = await plaidSyncItem(itemId);

      if (result.requiresReauth) {
        toast.warning("Account needs to be reconnected", {
          description: "Click 'Manage Accounts' to reconnect",
          duration: 5000,
        });
        return;
      }

      if (result.errors.length > 0) {
        toast.error(result.errors[0]);
        return;
      }

      // Build success message
      const parts: string[] = [];
      if (result.added > 0) {
        parts.push(`${result.added} new`);
      }
      if (result.modified > 0) {
        parts.push(`${result.modified} updated`);
      }
      if (result.removed > 0) {
        parts.push(`${result.removed} removed`);
      }

      if (parts.length > 0) {
        toast.success(`Synced: ${parts.join(", ")}`);
      } else {
        toast.success("Already up to date");
      }

      invalidateQueries();
    } catch {
      toast.error("Failed to sync transactions");
    } finally {
      setSyncingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectingItem) return;

    try {
      const response = await fetch(`/api/plaid/items/${disconnectingItem.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        // Get the plaid account IDs for this institution
        const plaidAccountIds = disconnectingItem.accounts.map(a => a.plaidAccountId);

        if (deleteTransactions) {
          // Delete accounts and their transactions
          for (const plaidAccountId of plaidAccountIds) {
            const localAccount = accounts.find(a => a.plaidAccountId === plaidAccountId);
            if (localAccount) {
              await deleteAccount.mutateAsync(localAccount.id);
            }
          }
          toast.success(`Disconnected ${disconnectingItem.institutionName} and deleted transactions`);
        } else {
          // Convert to manual accounts (clear plaid_account_id)
          for (const plaidAccountId of plaidAccountIds) {
            const localAccount = accounts.find(a => a.plaidAccountId === plaidAccountId);
            if (localAccount) {
              await updateAccount.mutateAsync({
                id: localAccount.id,
                name: localAccount.name,
                type: localAccount.type as AccountType,
                plaidAccountId: null,
              });
            }
          }
          toast.success(`Disconnected ${disconnectingItem.institutionName} (transactions kept)`);
        }

        invalidateQueries();
      } else {
        toast.error(result.error?.message || "Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect institution");
    } finally {
      setDisconnectingItem(null);
      setDeleteTransactions(false);
    }
  };

  // ========== Update Mode (Manage Accounts) Handlers ==========

  const handleManageAccounts = async (itemId: string) => {
    setUpdateModeItemId(itemId);
    setIsUpdatingAccounts(true);

    try {
      const response = await fetch("/api/plaid/update-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plaidItemId: itemId }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        setIsUpdatingAccounts(false);
        setUpdateModeItemId(null);
        return;
      }

      // Use shared linkToken state - the unified onSuccess will check updateModeItemId
      setLinkToken(data.linkToken);
    } catch {
      toast.error("Failed to initialize account management");
      setIsUpdatingAccounts(false);
      setUpdateModeItemId(null);
    }
  };

  const formatLastSynced = (lastSyncedAt: string | null): string => {
    if (!lastSyncedAt) return "Never synced";

    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "credit_card":
        return "Credit Card";
      case "checking":
        return "Checking";
      case "investment":
        return "Investment";
      case "loan":
        return "Loan";
      default:
        return type;
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "credit_card":
        return CreditCard;
      case "investment":
        return TrendingUp;
      default:
        return Building2;
    }
  };

  const hasNoAccounts = accounts.length === 0 && plaidItems.length === 0;

  return (
    <>
      {/* Plaid Link launcher - only mounts when we have a token */}
      {linkToken && (
        <PlaidLinkLauncher
          token={linkToken}
          onSuccess={onSuccess}
          onExit={handlePlaidExit}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: smoothEase }}
          className="flex flex-wrap gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-surface border border-border text-foreground-secondary font-medium text-sm hover:bg-surface-elevated hover:border-border-strong transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Manual Account
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px var(--primary)" }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchLinkToken}
            disabled={isConnecting}
            className="relative inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm disabled:opacity-60 overflow-hidden group"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Connect Bank</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Empty State */}
        {hasNoAccounts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: smoothEase }}
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* Gradient border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 via-primary/25 to-primary/20 p-[1px]">
                <div className="absolute inset-[1px] rounded-3xl bg-surface" />
              </div>

              {/* Inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent" />

              {/* Content */}
              <div className="relative flex flex-col items-center justify-center py-20 px-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative mb-6"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 w-20 h-20 bg-primary rounded-2xl blur-xl opacity-30" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-surface flex items-center justify-center">
                    <Building2 className="w-9 h-9 text-primary" />
                  </div>
                </motion.div>

                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-semibold text-foreground mb-3"
                >
                  No accounts connected
                </motion.h3>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-muted-foreground max-w-md mb-8 leading-relaxed"
                >
                  Add a manual account for CSV imports or connect your bank for automatic transaction syncing.
                  Supports Chase, Amex, Fidelity, Robinhood, and thousands more.
                </motion.p>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchLinkToken}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {isConnecting ? "Connecting..." : "Connect Bank"}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connected Institutions */}
        {plaidItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: smoothEase }}
            className="space-y-5"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Link2 className="w-4 h-4 text-primary" />
                  </div>
                  Connected Institutions
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {plaidItems.length} institution{plaidItems.length !== 1 ? "s" : ""} syncing automatically
                </p>
              </div>
              {plaidItems.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    for (const item of plaidItems) {
                      await handleSync(item.id);
                    }
                  }}
                  disabled={syncingItems.size > 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-foreground-secondary text-sm font-medium hover:bg-surface-overlay hover:text-foreground transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingItems.size > 0 ? "animate-spin" : ""}`} />
                  Sync All
                </motion.button>
              )}
            </div>

            {/* Institution Cards */}
            <div className="space-y-4">
              {plaidItems.map((item, index) => {
                const isSyncing = syncingItems.has(item.id);
                const isUpdating = isUpdatingAccounts && updateModeItemId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative"
                  >
                    {/* Card with gradient border when syncing */}
                    <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                      isSyncing
                        ? "shadow-[0_0_40px_var(--primary)]"
                        : "hover:shadow-[0_0_30px_var(--primary)/10]"
                    }`}>
                      {/* Gradient border for syncing state */}
                      {isSyncing && (
                        <>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient p-[1px]" />
                          <div className="absolute inset-[1px] rounded-2xl bg-surface" />
                        </>
                      )}

                      {/* Card background */}
                      <div className={`relative rounded-2xl bg-surface border ${
                        isSyncing ? "border-transparent" : "border-border-subtle"
                      } p-6`}>
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                        <div className="relative">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-4">
                              {/* Institution icon with glow */}
                              <div className="relative">
                                <div className="absolute inset-0 bg-primary rounded-xl blur-lg opacity-20" />
                                <div className="relative p-3.5 rounded-xl bg-gradient-to-br from-muted to-surface">
                                  <Building2 className="w-6 h-6 text-primary" />
                                </div>
                              </div>

                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {item.institutionName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-foreground-dim" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatLastSynced(item.lastSyncedAt)}
                                  </span>
                                  {isSyncing && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-medium text-primary">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                      Syncing
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSync(item.id)}
                                disabled={isSyncing || isUpdatingAccounts}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-elevated border border-border text-foreground-secondary text-sm font-medium hover:bg-surface-overlay hover:text-foreground transition-all disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                                Sync
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleManageAccounts(item.id)}
                                disabled={isSyncing || isUpdatingAccounts}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-elevated border border-border text-foreground-secondary text-sm font-medium hover:bg-surface-overlay hover:text-foreground transition-all disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Settings2 className="w-3.5 h-3.5" />
                                )}
                                Manage
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDisconnectingItem(item)}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-elevated border border-border text-danger text-sm font-medium hover:bg-danger/10 hover:border-danger/30 transition-all"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                                Disconnect
                              </motion.button>
                            </div>

                            {/* Mobile Menu */}
                            <div className="md:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 rounded-lg bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
                                  <DropdownMenuItem
                                    onClick={() => handleSync(item.id)}
                                    disabled={isSyncing || isUpdatingAccounts}
                                    className="text-foreground-secondary focus:bg-muted"
                                  >
                                    {isSyncing ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Sync
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleManageAccounts(item.id)}
                                    disabled={isSyncing || isUpdatingAccounts}
                                    className="text-foreground-secondary focus:bg-muted"
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Settings2 className="w-4 h-4 mr-2" />
                                    )}
                                    Manage Accounts
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem
                                    onClick={() => setDisconnectingItem(item)}
                                    className="text-danger focus:bg-danger/10"
                                  >
                                    <Unlink className="w-4 h-4 mr-2" />
                                    Disconnect
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Account badges */}
                          <div className="flex flex-wrap gap-2">
                            {item.accounts.map((account) => {
                              const fullAccount = connectedAccounts.find(a => a.plaidAccountId === account.plaidAccountId);
                              return (
                                <motion.button
                                  key={account.id}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => fullAccount && handleEdit(fullAccount)}
                                  className="group/badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-xs font-medium text-foreground-secondary hover:bg-surface-overlay hover:border-border-strong transition-all cursor-pointer"
                                  title="Click to rename"
                                >
                                  {fullAccount?.name || account.name}
                                  <Pencil className="w-3 h-3 opacity-0 group-hover/badge:opacity-50 transition-opacity" />
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Manual Accounts */}
        {manualAccounts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: smoothEase }}
            className="space-y-5"
          >
            {/* Section Header */}
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gold/15">
                  <Wallet className="w-4 h-4 text-gold" />
                </div>
                Manual Accounts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {manualAccounts.length} account{manualAccounts.length !== 1 ? "s" : ""} for CSV imports
              </p>
            </div>

            {/* Account Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {manualAccounts.map((account, index) => {
                const AccountIcon = getAccountIcon(account.type);

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <div className="relative h-full rounded-2xl bg-surface border border-border-subtle hover:border-gold/30 transition-all duration-300 overflow-hidden">
                      {/* Gold gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {/* Icon with gold tint */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-gold rounded-xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity" />
                              <div className="relative p-2.5 rounded-xl bg-gold/10 group-hover:bg-gold/15 transition-colors">
                                <AccountIcon className="w-5 h-5 text-gold" />
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-foreground-bright transition-colors">
                                {account.name}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] font-medium text-muted-foreground mt-1.5">
                                {getAccountTypeLabel(account.type)}
                              </span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground-secondary hover:bg-surface-elevated transition-all opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
                              <DropdownMenuItem
                                onClick={() => handleEdit(account)}
                                className="text-foreground-secondary focus:bg-muted"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingAccount(account)}
                                className="text-danger focus:bg-danger/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* ========== Dialogs ========== */}

      {/* Create Manual Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Manual Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new account for importing CSV transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-foreground-secondary">Account Name</Label>
              <Input
                id="new-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Chase Checking"
                className="bg-surface border-border text-foreground placeholder:text-foreground-dim focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-type" className="text-foreground-secondary">Account Type</Label>
              <Select
                value={newAccountType}
                onValueChange={(v) => setNewAccountType(v as AccountType)}
              >
                <SelectTrigger id="new-type" className="bg-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="checking" className="text-foreground-secondary focus:bg-muted">Checking Account</SelectItem>
                  <SelectItem value="credit_card" className="text-foreground-secondary focus:bg-muted">Credit Card</SelectItem>
                  <SelectItem value="investment" className="text-foreground-secondary focus:bg-muted">Investment</SelectItem>
                  <SelectItem value="loan" className="text-foreground-secondary focus:bg-muted">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAccount}
              disabled={createAccount.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createAccount.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the account name or type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground-secondary">Account Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Chase Checking"
                className="bg-surface border-border text-foreground placeholder:text-foreground-dim focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type" className="text-foreground-secondary">Account Type</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as AccountType)}>
                <SelectTrigger id="edit-type" className="bg-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="checking" className="text-foreground-secondary focus:bg-muted">Checking Account</SelectItem>
                  <SelectItem value="credit_card" className="text-foreground-secondary focus:bg-muted">Credit Card</SelectItem>
                  <SelectItem value="investment" className="text-foreground-secondary focus:bg-muted">Investment</SelectItem>
                  <SelectItem value="loan" className="text-foreground-secondary focus:bg-muted">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAccount(null)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateAccount.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateAccount.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deletingAccount?.name}&quot;? This will
              also delete all transactions associated with this account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingAccount(null)}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
              className="bg-destructive text-primary-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Institution Dialog */}
      <Dialog
        open={!!disconnectingItem}
        onOpenChange={() => {
          setDisconnectingItem(null);
          setDeleteTransactions(false);
        }}
      >
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Disconnect Institution</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to disconnect{" "}
              <span className="font-medium text-foreground-secondary">
                {disconnectingItem?.institutionName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground-secondary">Keep transactions</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Transactions will remain in your account but won&apos;t sync anymore
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer hover:bg-surface-elevated transition-colors">
              <input
                type="checkbox"
                checked={deleteTransactions}
                onChange={(e) => setDeleteTransactions(e.target.checked)}
                className="mt-1 rounded border-border-strong bg-surface"
              />
              <div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger" />
                  <p className="font-medium text-foreground-secondary">Delete all transactions</p>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Permanently delete all transactions from this institution
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisconnectingItem(null);
                setDeleteTransactions(false);
              }}
              className="bg-transparent border-border text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="bg-destructive text-primary-foreground hover:bg-destructive/90"
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plaid Sync Modal */}
      <PlaidSyncModal
        isOpen={syncModalOpen}
        institutionName={syncModalInstitution}
        onComplete={handleSyncModalComplete}
        syncFunction={performModalSync}
      />
    </>
  );
}
