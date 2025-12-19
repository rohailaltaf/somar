"use client";

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { deleteAccount, updateAccount, AccountType, createAccount } from "@/actions/accounts";
import {
  PlaidItemWithAccounts,
  disconnectInstitution,
  syncTransactionsForItem,
  refreshHistoricalData,
  updatePlaidItemAccounts,
} from "@/actions/plaid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Link2,
  Plus,
  RefreshCw,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Settings2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface AccountWithPlaid {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  plaidItemId: string | null;
  plaidAccountId: string | null;
  plaidItem: {
    institutionName: string;
    lastSyncedAt: string | null;
  } | null;
}

interface AccountsInterfaceProps {
  accounts: AccountWithPlaid[];
  plaidItems: PlaidItemWithAccounts[];
}

export function AccountsInterface({ accounts, plaidItems }: AccountsInterfaceProps) {
  // State for account management
  const [editingAccount, setEditingAccount] = useState<AccountWithPlaid | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountWithPlaid | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("checking");
  
  // State for manual account creation
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("checking");
  const [isCreating, setIsCreating] = useState(false);
  
  // State for Plaid connection
  const [items, setItems] = useState<PlaidItemWithAccounts[]>(plaidItems);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());
  const [refreshingItems, setRefreshingItems] = useState<Set<string>>(new Set());
  const [disconnectingItem, setDisconnectingItem] = useState<PlaidItemWithAccounts | null>(null);
  const [deleteTransactions, setDeleteTransactions] = useState(false);
  
  // State for update mode (managing accounts)
  const [updateModeItemId, setUpdateModeItemId] = useState<string | null>(null);
  const [updateModeLinkToken, setUpdateModeLinkToken] = useState<string | null>(null);
  const [isUpdatingAccounts, setIsUpdatingAccounts] = useState(false);

  // Separate accounts into connected and manual
  const connectedAccounts = accounts.filter((a) => a.plaidItemId);
  const manualAccounts = accounts.filter((a) => !a.plaidItemId);

  // ========== Manual Account Handlers ==========
  
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    setIsCreating(true);
    try {
      await createAccount(newAccountName.trim(), newAccountType);
      toast.success("Account created");
      setShowCreateDialog(false);
      setNewAccountName("");
      setNewAccountType("checking");
      window.location.reload();
    } catch {
      toast.error("Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (account: AccountWithPlaid) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditType(account.type as AccountType);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount || !editName.trim()) return;

    await updateAccount(editingAccount.id, editName.trim(), editType);
    setEditingAccount(null);
    toast.success("Account updated");
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;

    await deleteAccount(deletingAccount.id);
    setDeletingAccount(null);
    toast.success("Account deleted");
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

  const onSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
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
          return;
        }

        toast.success(
          `Connected ${metadata.institution?.name}! ${data.accountCount} account(s) added.`
        );

        window.location.reload();
      } catch {
        toast.error("Failed to connect institution");
      } finally {
        setIsConnecting(false);
        setLinkToken(null);
      }
    },
    []
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => {
      setIsConnecting(false);
      setLinkToken(null);
    },
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const handleSync = async (itemId: string) => {
    setSyncingItems((prev) => new Set(prev).add(itemId));

    try {
      const result = await syncTransactionsForItem(itemId);
      toast.success(
        `Synced: ${result.added} added, ${result.modified} modified, ${result.removed} removed`
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, lastSyncedAt: new Date().toISOString() }
            : item
        )
      );
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

  const handleRefreshHistory = async (itemId: string) => {
    setRefreshingItems((prev) => new Set(prev).add(itemId));

    try {
      const result = await refreshHistoricalData(itemId);
      toast.success(
        `Refreshed history: ${result.added} transactions added`
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, lastSyncedAt: new Date().toISOString() }
            : item
        )
      );
    } catch {
      toast.error("Failed to refresh historical data");
    } finally {
      setRefreshingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectingItem) return;

    try {
      const result = await disconnectInstitution(
        disconnectingItem.id,
        deleteTransactions
      );

      if (result.success) {
        toast.success(
          `Disconnected ${disconnectingItem.institutionName}${
            deleteTransactions ? " and deleted transactions" : ""
          }`
        );
        setItems((prev) =>
          prev.filter((item) => item.id !== disconnectingItem.id)
        );
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to disconnect");
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

      setUpdateModeLinkToken(data.linkToken);
    } catch {
      toast.error("Failed to initialize account management");
      setIsUpdatingAccounts(false);
      setUpdateModeItemId(null);
    }
  };

  const onUpdateModeSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      // In update mode, publicToken will be the same as before - no need to exchange
      // We just need to refresh the accounts list from Plaid
      if (!updateModeItemId) return;

      try {
        const result = await updatePlaidItemAccounts(updateModeItemId);

        if (result.success) {
          if (result.added > 0) {
            toast.success(
              `Added ${result.added} new account(s)! Total: ${result.total} accounts.`
            );
          } else {
            toast.info("Account selection updated. No new accounts added.");
          }
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to update accounts");
        }
      } catch {
        toast.error("Failed to update accounts");
      } finally {
        setIsUpdatingAccounts(false);
        setUpdateModeItemId(null);
        setUpdateModeLinkToken(null);
      }
    },
    [updateModeItemId]
  );

  // Plaid Link for update mode
  const {
    open: openUpdateMode,
    ready: updateModeReady,
  } = usePlaidLink({
    token: updateModeLinkToken,
    onSuccess: onUpdateModeSuccess,
    onExit: () => {
      setIsUpdatingAccounts(false);
      setUpdateModeItemId(null);
      setUpdateModeLinkToken(null);
    },
  });

  // Open update mode when link token is ready
  useEffect(() => {
    if (updateModeLinkToken && updateModeReady) {
      openUpdateMode();
    }
  }, [updateModeLinkToken, updateModeReady, openUpdateMode]);

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

  const hasNoAccounts = accounts.length === 0 && items.length === 0;

  return (
    <>
      {/* Add Account Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={() => setShowCreateDialog(true)} variant="outline">
          <Wallet className="w-4 h-4 mr-2" />
          Add Manual Account
        </Button>
        <Button onClick={fetchLinkToken} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              Connect Bank
            </>
          )}
        </Button>
      </div>

      {/* Empty State */}
      {hasNoAccounts && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Building2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No accounts yet</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Add a manual account for CSV imports or connect your bank for automatic transaction syncing.
              Supports Chase, Amex, Fidelity, Robinhood, and thousands more.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connected Institutions */}
      {items.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Connected Institutions
            </h2>
            {items.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  for (const item of items) {
                    await handleSync(item.id);
                  }
                }}
                disabled={syncingItems.size > 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {item.institutionName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatLastSynced(item.lastSyncedAt)}
                        </CardDescription>
                      </div>
                    </div>
                    {/* Desktop: Show all buttons */}
                    <div className="hidden md:flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(item.id)}
                        disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                      >
                        {syncingItems.has(item.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-2">Sync</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageAccounts(item.id)}
                        disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                        title="Add or remove accounts from this connection"
                      >
                        {isUpdatingAccounts && updateModeItemId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Settings2 className="w-4 h-4" />
                        )}
                        <span className="ml-2">Manage Accounts</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshHistory(item.id)}
                        disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                        title="Re-fetch all historical transactions (use if initial sync was incomplete)"
                      >
                        {refreshingItems.has(item.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span className="ml-2">Refresh History</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisconnectingItem(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="w-4 h-4" />
                        <span className="ml-2">Disconnect</span>
                      </Button>
                    </div>

                    {/* Mobile: 3-dot menu */}
                    <div className="md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleSync(item.id)}
                            disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                          >
                            {syncingItems.has(item.id) ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Sync
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleManageAccounts(item.id)}
                            disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                          >
                            {isUpdatingAccounts && updateModeItemId === item.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Settings2 className="w-4 h-4 mr-2" />
                            )}
                            Manage Accounts
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRefreshHistory(item.id)}
                            disabled={syncingItems.has(item.id) || refreshingItems.has(item.id) || isUpdatingAccounts}
                          >
                            {refreshingItems.has(item.id) ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4 mr-2" />
                            )}
                            Refresh History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDisconnectingItem(item)}
                            className="text-destructive"
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Disconnect
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.accounts.map((account) => (
                      <Badge key={account.id} variant="secondary">
                        {account.name}
                        <span className="ml-1 text-muted-foreground">
                          ({account.type === "credit_card" ? "CC" : account.type})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manual Accounts */}
      {manualAccounts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Manual Accounts
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {manualAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    {account.type === "credit_card" ? (
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary">
                          {getAccountTypeLabel(account.type)}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(account)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingAccount(account)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Manual Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Manual Account</DialogTitle>
            <DialogDescription>
              Add a new account for importing CSV transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Account Name</Label>
              <Input
                id="new-name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Chase Checking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-type">Account Type</Label>
              <Select
                value={newAccountType}
                onValueChange={(v) => setNewAccountType(v as AccountType)}
              >
                <SelectTrigger id="new-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account name or type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Account Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Chase Checking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Account Type</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as AccountType)}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={!!deletingAccount} onOpenChange={() => setDeletingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingAccount?.name}&quot;? This will
              also delete all transactions associated with this account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAccount(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Institution</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect{" "}
              <span className="font-medium">
                {disconnectingItem?.institutionName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Keep transactions</p>
                <p className="text-sm text-muted-foreground">
                  Transactions will remain in your account but won&apos;t sync
                  anymore
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={deleteTransactions}
                onChange={(e) => setDeleteTransactions(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="font-medium">Delete all transactions</p>
                </div>
                <p className="text-sm text-muted-foreground">
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
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

