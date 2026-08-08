import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Download, Package, AlertTriangle, DollarSign } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import KpiCard from "../../components/shared/KpiCard";
import { TableCard, Th, Td, TrHover } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormSelect } from "../../components/shared/FormInput";
import { inventoryService } from "../../services/inventory.service";
import { downloadCsv } from "../../utils/csvExport";
import { success, error as showError, confirmAction } from "../../components/shared/SweetAlert";

const CATEGORIES = ["Cardiovascular", "Antidiabetic", "IV Fluids", "Antibiotics", "GI", "Anticoagulant", "Analgesic", "Supplies"];
const UNITS = ["tablets", "capsules", "vials", "bags", "syringes", "bottles", "units"];

function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "Cardiovascular", stock: "", minStock: "", unit: "tablets", unitCost: "", status: "ok",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    inventoryService.list()
      .then(data => setInventory(data))
      .catch(err => setError(err.message || "Failed to load inventory"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalItems = inventory.reduce((sum, i) => sum + (i.stock || 0), 0);
  const lowStockCount = inventory.filter(i => i.status !== "ok").length;
  const stockValue = inventory.reduce((sum, i) => sum + (i.stock || 0) * (i.unitCost || 0), 0);

  const handleReorder = async (id: string) => {
    try {
      const updated = await inventoryService.adjustStock(id, 50);
      setInventory(prev => prev.map(item => item.id === id ? { ...item, stock: updated.stock, status: updated.status } : item));
      success("Stock reordered");
    } catch (err: any) {
      showError("Reorder failed", err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.stock || !form.minStock) {
      showError("Validation", "Name, stock and minimum stock are required");
      return;
    }
    const confirmed = await confirmAction("Add inventory item?", `Add ${form.name} to the stock register?`, "Add Item");
    if (!confirmed) return;
    setSaving(true);
    try {
      await inventoryService.create({
        name: form.name,
        category: form.category,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        unit: form.unit,
        unitCost: Number(form.unitCost) || 0,
        status: form.status,
      });
      success("Item added");
      setModalOpen(false);
      setForm({ name: "", category: "Cardiovascular", stock: "", minStock: "", unit: "tablets", unitCost: "", status: "ok" });
      load();
    } catch (err: any) {
      showError("Create failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatNaira = (v: number) => {
    if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
    return `₦${v}`;
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Inventory" subtitle="Pharmacy & medical supplies stock"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>Add Item</PrimaryBtn>}
      />
      <div className="grid grid-cols-3 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <KpiCard icon={Package} label="Total Items" value={`${totalItems}`} delta="—" deltaUp sub="SKUs tracked" color="#0F7D7A" />
            <KpiCard icon={AlertTriangle} label="Low / Critical Stock" value={`${lowStockCount}`} delta="—" deltaUp={false} sub="Reorder required" color="#F59E0B" />
            <KpiCard icon={DollarSign} label="Stock Value" value={formatNaira(stockValue)} delta="—" deltaUp sub="Estimated total" color="#4CAF50" />
          </>
        )}
      </div>

      {lowStockCount > 0 && !loading && (
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", boxShadow: "var(--skeuo-shadow-sm)" }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#92400E" }}>{lowStockCount} items need reordering</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>Some items are below minimum stock level. Immediate reorder recommended.</p>
          </div>
        </div>
      )}

      <TableCard title="Stock Register" action={<GhostBtn icon={Download} onClick={() => downloadCsv("inventory.csv", inventory.map(item => ({
        name: item.name,
        category: item.category,
        stock: item.stock,
        minStock: item.minStock,
        unit: item.unit,
        unitCost: item.unitCost,
        status: item.status,
      })))}>Export CSV</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Item</Th><Th>Category</Th><Th>In Stock</Th><Th>Min Stock</Th><Th>Unit Cost</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={6} cols={7} />
            ) : (
              <>
                {inventory.map(item => (
                  <TrHover key={item.id}>
                    <Td className="font-semibold text-foreground">{item.name}</Td>
                    <Td className="text-muted-foreground">{item.category}</Td>
                    <Td><span className={`font-bold ${item.stock < item.minStock ? "text-red-600" : "text-foreground"}`}>{item.stock} {item.unit}</span></Td>
                    <Td className="text-muted-foreground">{item.minStock} {item.unit}</Td>
                    <Td className="text-muted-foreground">₦{(item.unitCost || 0).toLocaleString()}</Td>
                    <Td><StatusPill status={item.status === "critical" ? "critical" : item.status === "low" ? "low" : "ok"} /></Td>
                    <Td>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReorder(item.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: "#0F7D7A", background: "#E6F7F6", boxShadow: "var(--skeuo-shadow-sm)" }}
                      >
                        Reorder
                      </motion.button>
                    </Td>
                  </TrHover>
                ))}
                {inventory.length === 0 && <tr><Td colSpan={7} className="text-center py-12 text-muted-foreground">No inventory items.</Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Inventory Item" size="md">
        <form onSubmit={handleCreate}>
          <FormInput label="Item name" value={form.name} onChange={v => setForm({ ...form, name: v })} required />
          <FormSelect label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput label="Stock" type="number" value={form.stock} onChange={v => setForm({ ...form, stock: v })} required />
            <FormInput label="Min Stock" type="number" value={form.minStock} onChange={v => setForm({ ...form, minStock: v })} required />
            <FormSelect label="Unit" value={form.unit} onChange={v => setForm({ ...form, unit: v })} options={UNITS.map(u => ({ value: u, label: u }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Unit Cost (₦)" type="number" value={form.unitCost} onChange={v => setForm({ ...form, unitCost: v })} />
            <FormSelect label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={[{ value: "ok", label: "In Stock" }, { value: "low", label: "Low" }, { value: "critical", label: "Critical" }]} />
          </div>
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Saving…" : "Add Item"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default InventoryPage;
