import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  Clock,
  DollarSign,
  Package,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  User,
  Phone,
  Calendar,
  CreditCard
} from 'lucide-react';

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  location?: string;
  is_active: boolean;
  current_sale_id?: string;
  current_sale?: TableSale;
  created_at: string;
  updated_at: string;
}

interface TableSale {
  id: string;
  table_id: string;
  sale_number: number;
  operator_name?: string;
  customer_name?: string;
  customer_count: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
  change_amount: number;
  status: 'aberta' | 'fechada' | 'cancelada';
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  items?: TableSaleItem[];
}

interface TableSaleItem {
  id: string;
  sale_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg?: number;
  unit_price?: number;
  price_per_gram?: number;
  discount_amount: number;
  subtotal: number;
  notes?: string;
  created_at: string;
}

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [sales, setSales] = useState<TableSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<TableSale | null>(null);
  const [showNewSale, setShowNewSale] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [paymentType, setPaymentType] = useState<string>('');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [finalizing, setFinalizing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  const [newSale, setNewSale] = useState({
    table_id: '',
    customer_name: '',
    customer_count: 1,
    operator_name: operatorName || 'Operador'
  });

  const [newItem, setNewItem] = useState({
    product_code: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  });

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800';
      case 'limpeza': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const getSaleStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-green-100 text-green-800';
      case 'fechada': return 'bg-blue-100 text-blue-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSaleStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta';
      case 'fechada': return 'Fechada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Misto'
    };
    return methods[method] || method;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área interna',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: 'Mesa 2',
            capacity: 2,
            status: 'ocupada',
            location: 'Área externa',
            is_active: true,
            current_sale_id: 'demo-sale-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const demoSales: TableSale[] = [
          {
            id: 'demo-sale-1',
            table_id: '2',
            sale_number: 1001,
            operator_name: operatorName || 'Operador',
            customer_name: 'João Silva',
            customer_count: 2,
            subtotal: 45.90,
            discount_amount: 0,
            total_amount: 45.90,
            change_amount: 0,
            status: 'aberta',
            opened_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            items: [
              {
                id: 'item-1',
                sale_id: 'demo-sale-1',
                product_code: 'ACAI500',
                product_name: 'Açaí 500ml',
                quantity: 2,
                unit_price: 22.95,
                discount_amount: 0,
                subtotal: 45.90,
                created_at: new Date().toISOString()
              }
            ]
          }
        ];

        setTables(demoTables);
        setSales(demoSales);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando dados das mesas da Loja ${storeId}...`);
      
      const tablePrefix = storeId === 1 ? 'store1' : 'store2';
      
      // Buscar mesas
      const { data: tablesData, error: tablesError } = await supabase
        .from(`${tablePrefix}_tables`)
        .select('*')
        .order('number');

      if (tablesError) throw tablesError;

      // Buscar vendas abertas
      const { data: salesData, error: salesError } = await supabase
        .from(`${tablePrefix}_table_sales`)
        .select(`
          *,
          ${tablePrefix}_table_sale_items(*)
        `)
        .eq('status', 'aberta')
        .order('opened_at', { ascending: false });

      if (salesError) throw salesError;

      setTables(tablesData || []);
      setSales(salesData || []);
      
      console.log(`✅ Carregadas ${tablesData?.length || 0} mesas e ${salesData?.length || 0} vendas da Loja ${storeId}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar dados da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async () => {
    if (!newSale.table_id || !newSale.customer_name) return;

    setCreating(true);
    try {
      const tablePrefix = storeId === 1 ? 'store1' : 'store2';
      
      const { data, error } = await supabase
        .from(`${tablePrefix}_table_sales`)
        .insert([{
          table_id: newSale.table_id,
          operator_name: newSale.operator_name,
          customer_name: newSale.customer_name,
          customer_count: newSale.customer_count,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          change_amount: 0,
          status: 'aberta',
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar status da mesa
      await supabase
        .from(`${tablePrefix}_tables`)
        .update({ 
          status: 'ocupada',
          current_sale_id: data.id
        })
        .eq('id', newSale.table_id);

      setShowNewSale(false);
      setNewSale({
        table_id: '',
        customer_name: '',
        customer_count: 1,
        operator_name: operatorName || 'Operador'
      });
      
      await fetchData();
    } catch (err) {
      console.error(`❌ Erro ao criar venda da Loja ${storeId}:`, err);
      alert('Erro ao criar venda. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedSale || !newItem.product_name || !newItem.quantity) return;

    setAddingItem(true);
    try {
      const tablePrefix = storeId === 1 ? 'store1' : 'store2';
      const subtotal = newItem.quantity * newItem.unit_price;
      
      const { data, error } = await supabase
        .from(`${tablePrefix}_table_sale_items`)
        .insert([{
          sale_id: selectedSale.id,
          product_code: newItem.product_code || 'MANUAL',
          product_name: newItem.product_name,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          discount_amount: 0,
          subtotal: subtotal,
          notes: newItem.notes
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar totais da venda
      const newSubtotal = selectedSale.subtotal + subtotal;
      const newTotal = newSubtotal - selectedSale.discount_amount;

      await supabase
        .from(`${tablePrefix}_table_sales`)
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal
        })
        .eq('id', selectedSale.id);

      setShowAddItem(false);
      setNewItem({
        product_code: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        notes: ''
      });
      
      await fetchData();
      
      // Recarregar venda selecionada
      const updatedSale = sales.find(s => s.id === selectedSale.id);
      if (updatedSale) {
        setSelectedSale(updatedSale);
      }
    } catch (err) {
      console.error(`❌ Erro ao adicionar item da Loja ${storeId}:`, err);
      alert('Erro ao adicionar item. Tente novamente.');
    } finally {
      setAddingItem(false);
    }
  };

  const finalizeSale = async (saleId: string, paymentType: string, changeFor?: number) => {
    try {
      const tablePrefix = storeId === 1 ? 'store1' : 'store2';
      
      // Finalizar venda
      const { data: saleData, error: saleError } = await supabase
        .from(`${tablePrefix}_table_sales`)
        .update({
          payment_type: paymentType,
          change_amount: changeFor || 0,
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', saleId)
        .select()
        .single();

      if (saleError) throw saleError;

      // Buscar caixa aberto para adicionar entrada
      const cashRegisterTable = storeId === 1 ? 'pdv_cash_registers' : 'pdv2_cash_registers';
      const cashEntriesTable = storeId === 1 ? 'pdv_cash_entries' : 'pdv2_cash_entries';
      
      const { data: openRegister } = await supabase
        .from(cashRegisterTable)
        .select('id')
        .is('closed_at', null)
        .single();

      if (openRegister) {
        // Adicionar entrada ao caixa
        await supabase
          .from(cashEntriesTable)
          .insert([{
            register_id: openRegister.id,
            type: 'income',
            amount: saleData.total_amount,
            description: `Venda Mesa #${saleData.sale_number}`,
            payment_method: paymentType
          }]);
      }

      // Atualizar status da mesa
      const { data: tableData } = await supabase
        .from(`${tablePrefix}_tables`)
        .select('*')
        .eq('current_sale_id', saleId)
        .single();

      if (tableData) {
        await supabase
          .from(`${tablePrefix}_tables`)
          .update({ 
            status: 'aguardando_conta',
            current_sale_id: null
          })
          .eq('id', tableData.id);
      }

      return saleData;
    } catch (err) {
      console.error(`❌ Erro ao finalizar venda da Loja ${storeId}:`, err);
      throw err;
    }
  };

  const handleFinalizeSale = async () => {
    if (!selectedSale || !paymentType) return;

    setFinalizing(true);
    try {
      await finalizeSale(selectedSale.id, paymentType, changeFor);
      setSelectedSale(null);
      setPaymentType('');
      setChangeFor(undefined);
      await fetchData();
    } catch (err) {
      alert('Erro ao finalizar venda. Tente novamente.');
    } finally {
      setFinalizing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando vendas de mesa da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Funcionalidades limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Vendas de Mesa - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setShowNewSale(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Venda
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Vendas Abertas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Vendas Abertas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mesa</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Pessoas</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Aberta em</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-800">
                      Mesa {tables.find(t => t.id === sale.table_id)?.number || '?'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-700">{sale.customer_name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-700">{sale.customer_count}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-green-600">
                      {formatPrice(sale.total_amount)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSaleStatusColor(sale.status)}`}>
                      {getSaleStatusLabel(sale.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {formatDateTime(sale.opened_at)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Gerenciar venda"
                    >
                      <Edit3 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sales.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma venda aberta</p>
          </div>
        )}
      </div>

      {/* Modal de Gerenciar Venda - CORRIGIDO PARA SER RESPONSIVO */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header fixo */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Gerenciar Venda - Mesa {tables.find(t => t.id === selectedSale.table_id)?.number}
                </h2>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Informações da Mesa */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Informações da Mesa</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Cliente</p>
                        <p className="font-medium">{selectedSale.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Pessoas</p>
                        <p className="font-medium">{selectedSale.customer_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Aberta em</p>
                        <p className="font-medium text-sm">{formatDateTime(selectedSale.opened_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Venda</p>
                        <p className="font-medium">#{selectedSale.sale_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itens da Venda */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-800">Itens da Venda</h3>
                  {selectedSale.status === 'aberta' && (
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-32 sm:max-h-48 overflow-y-auto">
                  {selectedSale.items?.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            Qtd: {item.quantity} × {formatPrice(item.unit_price || 0)}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-semibold text-green-600">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
                
                {(!selectedSale.items || selectedSale.items.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhum item adicionado</p>
                  </div>
                )}
              </div>

              {/* Resumo Financeiro */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Resumo Financeiro</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="font-medium text-red-600">-{formatPrice(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(selectedSale.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              {selectedSale.status === 'aberta' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Finalizar Venda</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de Pagamento *
                      </label>
                      <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione...</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="voucher">Voucher</option>
                        <option value="misto">Misto</option>
                      </select>
                    </div>

                    {paymentType === 'dinheiro' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Troco para
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={changeFor || ''}
                          onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo com botões */}
            {selectedSale.status === 'aberta' && (
              <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalizeSale}
                    disabled={!paymentType || finalizing}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                  >
                    {finalizing ? 'Finalizando...' : 'Finalizar Venda'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Adicionar Item - CORRIGIDO PARA SER RESPONSIVO */}
      {showAddItem && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header fixo */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Adicionar Item</h2>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <input
                  type="text"
                  value={newItem.product_name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={newItem.product_code}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_code: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código do produto"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Unitário *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Observações sobre o item..."
                />
              </div>

              {newItem.quantity > 0 && newItem.unit_price > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Subtotal:</span>
                    <span className="text-green-800 font-bold text-lg">
                      {formatPrice(newItem.quantity * newItem.unit_price)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo com botões */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.product_name || !newItem.quantity || addingItem}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  {addingItem ? 'Adicionando...' : 'Adicionar Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Venda - CORRIGIDO PARA SER RESPONSIVO */}
      {showNewSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header fixo */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Nova Venda</h2>
                <button
                  onClick={() => setShowNewSale(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesa *
                </label>
                <select
                  value={newSale.table_id}
                  onChange={(e) => setNewSale(prev => ({ ...prev, table_id: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma mesa</option>
                  {tables.filter(t => t.status === 'livre' && t.is_active).map(table => (
                    <option key={table.id} value={table.id}>
                      Mesa {table.number} - {table.name} (Cap: {table.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={newSale.customer_name}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <input
                  type="number"
                  min="1"
                  value={newSale.customer_count}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customer_count: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operador
                </label>
                <input
                  type="text"
                  value={newSale.operator_name}
                  onChange={(e) => setNewSale(prev => ({ ...prev, operator_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do operador"
                />
              </div>
            </div>

            {/* Footer fixo com botões */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowNewSale(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSale}
                  disabled={!newSale.table_id || !newSale.customer_name || creating}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  {creating ? 'Criando...' : 'Criar Venda'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;