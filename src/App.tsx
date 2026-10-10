import React, { useState, useEffect } from 'react';
import {
  loadInitialState,
  saveStateToStorage,
  calculateOperationsKPIs,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_WASTE,
  INITIAL_DONATIONS,
  INITIAL_ACTIVITY_LOGS,
  AppState,
} from './lib/store.ts';
import {
  Product,
  ProductUnit,
  PricingRecommendation,
  ActivityLog,
  SaleRecord,
  WasteRecord,
  DonationRecord,
} from './types/index.ts';
import {
  computeDeterministicRecommendation,
  calculateExpiryUrgency,
} from './lib/pricingEngine.ts';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { NotificationsDrawer } from './components/layout/NotificationsDrawer.tsx';
import { OperationsDashboard } from './components/dashboard/OperationsDashboard.tsx';
import { InventoryManager } from './components/inventory/InventoryManager.tsx';
import { ExpiryAlertsView } from './components/expiry/ExpiryAlertsView.tsx';
import { AIPricingView } from './components/pricing/AIPricingView.tsx';
import { DemandForecastView } from './components/forecast/DemandForecastView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { ActivityLogsView } from './components/activity/ActivityLogsView.tsx';
import { DatabaseConfigModal } from './components/settings/DatabaseConfigModal.tsx';
import { TestRunnerModal } from './components/tests/TestRunnerModal.tsx';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save changes to storage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const kpis = calculateOperationsKPIs(state);

  // Handlers for Inventory Actions
  const handleAddProduct = (newProdData: Partial<Product>) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      store_id: state.store.id,
      name: newProdData.name || 'New Product',
      sku: newProdData.sku || `SKU-${Date.now()}`,
      category: newProdData.category || 'Produce',
      quantity: newProdData.quantity || 10,
      unit: newProdData.unit || 'units',
      cost_price: newProdData.cost_price || 2.0,
      selling_price: newProdData.selling_price || 4.0,
      original_price: newProdData.selling_price || 4.0,
      discount_percentage: 0,
      expiry_date: newProdData.expiry_date || new Date(Date.now() + 5 * 86400000).toISOString(),
      shelf_life_days: newProdData.shelf_life_days || 7,
      sales_velocity: newProdData.sales_velocity || 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const rec = computeDeterministicRecommendation(newProduct, state.pricingOptions);

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: state.store.id,
      user_name: state.profile.full_name,
      user_role: state.profile.role,
      action: 'PRODUCT_CREATED',
      entity_type: 'product',
      entity_id: newProduct.id,
      description: `Cataloged new batch: ${newProduct.name} (${newProduct.quantity} ${newProduct.unit}, SKU: ${newProduct.sku})`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      recommendations: [rec, ...prev.recommendations],
      activityLogs: [log, ...prev.activityLogs],
    }));

    showToast(`Added "${newProduct.name}" to inventory.`);
  };

  const handleUpdateProduct = (id: string, updatedFields: Partial<Product>) => {
    setState((prev) => {
      const updatedProducts = prev.products.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          ...updatedFields,
          updated_at: new Date().toISOString(),
        };
      });

      const updatedRecs = updatedProducts.map((p) =>
        computeDeterministicRecommendation(p, prev.pricingOptions)
      );

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        store_id: prev.store.id,
        user_name: prev.profile.full_name,
        user_role: prev.profile.role,
        action: 'PRODUCT_UPDATED',
        entity_type: 'product',
        entity_id: id,
        description: `Updated inventory details for product SKU: ${updatedFields.sku || id}`,
        created_at: new Date().toISOString(),
      };

      return {
        ...prev,
        products: updatedProducts,
        recommendations: updatedRecs,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    showToast('Product details updated successfully.');
  };

  const handleDeleteProduct = (id: string) => {
    const prod = state.products.find((p) => p.id === id);
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
      recommendations: prev.recommendations.filter((r) => r.product_id !== id),
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          store_id: prev.store.id,
          user_name: prev.profile.full_name,
          user_role: prev.profile.role,
          action: 'PRODUCT_DELETED',
          entity_type: 'product',
          entity_id: id,
          description: `Removed SKU ${prod?.sku || id} (${prod?.name || 'Item'}) from catalog`,
          created_at: new Date().toISOString(),
        },
        ...prev.activityLogs,
      ],
    }));

    showToast(`Removed product from inventory.`);
  };

  // Direct Markdown Application
  const handleApplyMarkdown = (productId: string, discountPct: number) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    const newPrice = Number((prod.original_price * (1 - discountPct / 100)).toFixed(2));

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: state.store.id,
      user_name: state.profile.full_name,
      user_role: state.profile.role,
      action: 'PRICE_MARKDOWN_APPLIED',
      entity_type: 'product',
      entity_id: productId,
      description: `Applied ${discountPct}% clearance discount on ${prod.name} ($${prod.selling_price.toFixed(2)} → $${newPrice.toFixed(2)})`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              selling_price: newPrice,
              discount_percentage: discountPct,
              updated_at: new Date().toISOString(),
            }
          : p
      ),
      recommendations: prev.recommendations.map((r) =>
        r.product_id === productId
          ? { ...r, status: 'accepted', resolved_at: new Date().toISOString() }
          : r
      ),
      activityLogs: [log, ...prev.activityLogs],
    }));

    showToast(`Markdown applied: ${discountPct}% off ${prod.name}.`);
  };

  // Mark Stock as Sold (Clearance salvage)
  const handleMarkSold = (productId: string, quantity: number, unitPrice: number) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    const actualSoldQty = Math.min(prod.quantity, quantity);
    const rev = Number((actualSoldQty * unitPrice).toFixed(2));

    const sale: SaleRecord = {
      id: `sale-${Date.now()}`,
      store_id: state.store.id,
      product_id: productId,
      product_name: prod.name,
      category: prod.category,
      quantity_sold: actualSoldQty,
      unit_price: unitPrice,
      discount_percentage: prod.discount_percentage,
      revenue: rev,
      sold_at: new Date().toISOString(),
    };

    const remainingQty = prod.quantity - actualSoldQty;

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: state.store.id,
      user_name: state.profile.full_name,
      user_role: state.profile.role,
      action: 'STOCK_SOLD',
      entity_type: 'product',
      entity_id: productId,
      description: `Logged clearance sale: ${actualSoldQty} ${prod.unit} of ${prod.name} (Salvaged $${rev.toFixed(2)})`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products:
        remainingQty <= 0
          ? prev.products.filter((p) => p.id !== productId)
          : prev.products.map((p) =>
              p.id === productId ? { ...p, quantity: remainingQty } : p
            ),
      sales: [sale, ...prev.sales],
      activityLogs: [log, ...prev.activityLogs],
    }));

    showToast(`Recorded sale of ${actualSoldQty} ${prod.unit}. Salvaged $${rev.toFixed(2)}.`);
  };

  // Record Waste (Incident log)
  const handleRecordWaste = (
    productId: string,
    quantity: number,
    unit: ProductUnit,
    reason: 'Spoilage' | 'Passed Expiry'
  ) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    const actualQty = Math.min(prod.quantity, quantity);
    const estCost = Number((actualQty * prod.cost_price).toFixed(2));

    const waste: WasteRecord = {
      id: `wst-${Date.now()}`,
      store_id: state.store.id,
      product_id: productId,
      product_name: prod.name,
      category: prod.category,
      quantity_wasted: actualQty,
      unit,
      estimated_cost: estCost,
      reason,
      recorded_at: new Date().toISOString(),
    };

    const remainingQty = prod.quantity - actualQty;

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: state.store.id,
      user_name: state.profile.full_name,
      user_role: state.profile.role,
      action: 'WASTE_RECORDED',
      entity_type: 'waste',
      entity_id: waste.id,
      description: `Documented food waste: ${actualQty} ${unit} of ${prod.name} (${reason}, Loss: -$${estCost.toFixed(2)})`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products:
        remainingQty <= 0
          ? prev.products.filter((p) => p.id !== productId)
          : prev.products.map((p) =>
              p.id === productId ? { ...p, quantity: remainingQty } : p
            ),
      wasteRecords: [waste, ...prev.wasteRecords],
      activityLogs: [log, ...prev.activityLogs],
    }));

    showToast(`Logged waste record: ${actualQty} ${unit} (${reason}).`);
  };

  // Record Donation to food bank
  const handleRecordDonation = (
    productId: string,
    quantity: number,
    unit: ProductUnit,
    charity: string
  ) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    const actualQty = Math.min(prod.quantity, quantity);
    const val = Number((actualQty * prod.selling_price).toFixed(2));

    const donation: DonationRecord = {
      id: `don-${Date.now()}`,
      store_id: state.store.id,
      product_id: productId,
      product_name: prod.name,
      quantity_donated: actualQty,
      unit,
      estimated_value: val,
      charity_partner: charity,
      recorded_at: new Date().toISOString(),
    };

    const remainingQty = prod.quantity - actualQty;

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: state.store.id,
      user_name: state.profile.full_name,
      user_role: state.profile.role,
      action: 'DONATION_RECORDED',
      entity_type: 'donation',
      entity_id: donation.id,
      description: `Dispatched donation: ${actualQty} ${unit} of ${prod.name} to ${charity} (Valued at $${val.toFixed(2)})`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products:
        remainingQty <= 0
          ? prev.products.filter((p) => p.id !== productId)
          : prev.products.map((p) =>
              p.id === productId ? { ...p, quantity: remainingQty } : p
            ),
      donations: [donation, ...prev.donations],
      activityLogs: [log, ...prev.activityLogs],
    }));

    showToast(`Logged food donation: ${actualQty} ${unit} transferred to ${charity}.`);
  };

  // Accept Recommendation
  const handleAcceptRecommendation = (recId: string) => {
    const rec = state.recommendations.find((r) => r.id === recId);
    if (!rec) return;

    handleApplyMarkdown(rec.product_id, rec.discount_percentage);

    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((r) =>
        r.id === recId
          ? { ...r, status: 'accepted', resolved_at: new Date().toISOString() }
          : r
      ),
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          store_id: prev.store.id,
          user_name: prev.profile.full_name,
          user_role: prev.profile.role,
          action: 'AI_RECOMMENDATION_ACCEPTED',
          entity_type: 'recommendation',
          entity_id: recId,
          description: `Accepted recommendation for ${rec.product_name}: ${rec.discount_percentage}% off to $${rec.recommended_price.toFixed(2)}`,
          created_at: new Date().toISOString(),
        },
        ...prev.activityLogs,
      ],
    }));

    showToast(`Accepted recommendation for ${rec.product_name}.`);
  };

  // Reject Recommendation
  const handleRejectRecommendation = (recId: string) => {
    const rec = state.recommendations.find((r) => r.id === recId);
    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((r) =>
        r.id === recId
          ? { ...r, status: 'rejected', resolved_at: new Date().toISOString() }
          : r
      ),
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          store_id: prev.store.id,
          user_name: prev.profile.full_name,
          user_role: prev.profile.role,
          action: 'AI_RECOMMENDATION_REJECTED',
          entity_type: 'recommendation',
          entity_id: recId,
          description: `Rejected markdown suggestion for ${rec?.product_name || 'Item'}`,
          created_at: new Date().toISOString(),
        },
        ...prev.activityLogs,
      ],
    }));

    showToast('Recommendation rejected.');
  };

  // Modify and Apply Custom
  const handleModifyAndApply = (recId: string, customPrice: number, customDiscount: number) => {
    const rec = state.recommendations.find((r) => r.id === recId);
    if (!rec) return;

    handleApplyMarkdown(rec.product_id, customDiscount);

    setState((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((r) =>
        r.id === recId
          ? {
              ...r,
              recommended_price: customPrice,
              discount_percentage: customDiscount,
              status: 'modified',
              resolved_at: new Date().toISOString(),
            }
          : r
      ),
    }));

    showToast(`Applied custom price $${customPrice.toFixed(2)} (-${customDiscount}%).`);
  };

  // Bulk Discount
  const handleBulkDiscount = (ids: string[], discountPct: number) => {
    ids.forEach((id) => {
      handleApplyMarkdown(id, discountPct);
    });
    showToast(`Applied ${discountPct}% discount across ${ids.length} selected items.`);
  };

  // Import CSV
  const handleImportCSV = (imported: Product[]) => {
    const newRecs = imported.map((p) =>
      computeDeterministicRecommendation(p, state.pricingOptions)
    );

    setState((prev) => ({
      ...prev,
      products: [...imported, ...prev.products],
      recommendations: [...newRecs, ...prev.recommendations],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          store_id: prev.store.id,
          user_name: prev.profile.full_name,
          user_role: prev.profile.role,
          action: 'PRODUCT_CREATED',
          entity_type: 'product',
          entity_id: 'batch',
          description: `Imported ${imported.length} items from CSV manifest`,
          created_at: new Date().toISOString(),
        },
        ...prev.activityLogs,
      ],
    }));

    showToast(`Imported ${imported.length} items from CSV.`);
  };

  // Recompute All Recommendations
  const handleRegenerateRecommendations = () => {
    const newRecs = state.products
      .filter((p) => {
        const { urgency } = calculateExpiryUrgency(p.expiry_date);
        return urgency === 'Critical' || urgency === 'Urgent' || urgency === 'Upcoming';
      })
      .map((p) => computeDeterministicRecommendation(p, state.pricingOptions));

    setState((prev) => ({
      ...prev,
      recommendations: newRecs,
    }));

    showToast('Recomputed pricing recommendations across all perishable inventory.');
  };

  // AI Evaluation with Gemini
  const handleRunAIEvaluation = async (rec: PricingRecommendation) => {
    setIsGeneratingAI(true);
    try {
      const prod = state.products.find((p) => p.id === rec.product_id);
      if (!prod) return;

      const { daysRemaining } = calculateExpiryUrgency(prod.expiry_date);

      const res = await fetch('/api/ai/pricing-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: rec.product_name,
          category: rec.category,
          daysRemaining,
          quantity: prod.quantity,
          originalPrice: prod.original_price,
          costPrice: rec.cost_price,
          recommendedPrice: rec.recommended_price,
          discountPct: rec.discount_percentage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          recommendations: prev.recommendations.map((r) =>
            r.id === rec.id
              ? { ...r, explanation: data.explanation, ai_generated: data.ai_powered }
              : r
          ),
        }));
        showToast('Updated recommendation with Google Gemini insights.');
      } else {
        showToast('Generated rule-based explanation.');
      }
    } catch (err) {
      console.warn('AI explanation failed:', err);
      showToast('Analyzed with deterministic pricing engine.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Waste Batch Scan
  const handleRunAIBatch = async () => {
    setIsGeneratingAI(true);
    try {
      const critical = state.products
        .filter((p) => calculateExpiryUrgency(p.expiry_date).urgency === 'Critical')
        .map((p) => ({
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          hoursRemaining: calculateExpiryUrgency(p.expiry_date).hoursRemaining,
          sellingPrice: p.selling_price,
          costPrice: p.cost_price,
        }));

      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: state.store.name,
          totalProducts: state.products.length,
          criticalItems: critical,
          totalWasteAvoidedKg: kpis.estimated_waste_avoided_kg,
          co2AvoidedKg: kpis.co2_emissions_avoided_kg,
          activeMarkdownsCount: kpis.active_markdowns_count,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`AI Scan Complete: ${data.executive_summary?.slice(0, 75)}...`);
      } else {
        showToast('Completed deterministic waste scan.');
      }
    } catch {
      showToast('Completed operations scan.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Reset to Demo Data
  const handleResetDemoData = () => {
    localStorage.removeItem('smartsave_ai_state_v1');
    const fresh = loadInitialState();
    setState(fresh);
    showToast('Reset catalog to GreenOak Harvest Market default demo state.');
  };

  // Breadcrumbs text
  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'dashboard':
        return ['Operations Overview'];
      case 'inventory':
        return ['Inventory Management'];
      case 'expiry-alerts':
        return ['Expiry Management', 'Perishable Pipeline'];
      case 'ai-pricing':
        return ['AI Dynamic Pricing', 'Recommendations'];
      case 'forecasting':
        return ['Demand Forecasting'];
      case 'reports':
        return ['Waste & Recovery Audit'];
      case 'activity':
        return ['Activity History'];
      case 'tests':
        return ['Diagnostics', 'Test Suite'];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        isDemoMode={state.isDemoMode}
        criticalCount={kpis.critical_products_count}
        pendingRecCount={kpis.pending_recommendations_count}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isSidebarCollapsed ? 'ml-18' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header
          store={state.store}
          profile={state.profile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddProduct={() => setIsAddProductModalOpen(true)}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          unreadNotificationsCount={
            kpis.critical_products_count + kpis.pending_recommendations_count
          }
          onResetDemoData={handleResetDemoData}
          onRunAIBatch={handleRunAIBatch}
          isGeneratingAI={isGeneratingAI}
          breadcrumbs={getBreadcrumbs()}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <OperationsDashboard
              kpis={kpis}
              products={state.products}
              sales={state.sales}
              onNavigateToTab={(tab) => setCurrentTab(tab as NavigationTab)}
              isDemoMode={state.isDemoMode}
              storeName={state.store.name}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryManager
              products={state.products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDiscount={handleBulkDiscount}
              onImportCSV={handleImportCSV}
              isAddModalOpen={isAddProductModalOpen}
              onCloseAddModal={() => setIsAddProductModalOpen(false)}
              onOpenAddModal={() => setIsAddProductModalOpen(true)}
            />
          )}

          {currentTab === 'expiry-alerts' && (
            <ExpiryAlertsView
              products={state.products}
              onApplyMarkdown={handleApplyMarkdown}
              onMarkSold={handleMarkSold}
              onRecordWaste={handleRecordWaste}
              onRecordDonation={handleRecordDonation}
            />
          )}

          {currentTab === 'ai-pricing' && (
            <AIPricingView
              recommendations={state.recommendations}
              products={state.products}
              onAcceptRecommendation={handleAcceptRecommendation}
              onRejectRecommendation={handleRejectRecommendation}
              onModifyAndApply={handleModifyAndApply}
              onRegenerateAll={handleRegenerateRecommendations}
              pricingOptions={state.pricingOptions}
              onUpdatePricingOptions={(opts) =>
                setState((prev) => ({ ...prev, pricingOptions: opts }))
              }
              onRunAIEvaluation={handleRunAIEvaluation}
              isGeneratingAI={isGeneratingAI}
            />
          )}

          {currentTab === 'forecasting' && (
            <DemandForecastView
              products={state.products}
              sales={state.sales}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              products={state.products}
              sales={state.sales}
              wasteRecords={state.wasteRecords}
              donations={state.donations}
              kpis={kpis}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityLogsView logs={state.activityLogs} />
          )}

          {currentTab === 'tests' && (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
              <TestRunnerModal
                isOpen={true}
                onClose={() => setCurrentTab('dashboard')}
              />
            </div>
          )}
        </main>
      </div>

      {/* Slide-out Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        products={state.products}
        recommendations={state.recommendations}
        onAcceptRecommendation={handleAcceptRecommendation}
        onNavigateToTab={(tab) => {
          setCurrentTab(tab);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Database / Supabase Configuration Modal */}
      <DatabaseConfigModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        isDemoMode={state.isDemoMode}
        onToggleDemoMode={(enabled) =>
          setState((prev) => ({ ...prev, isDemoMode: enabled }))
        }
      />

      {/* Test Modal (if triggered via shortcut) */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-stone-800 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
