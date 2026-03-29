import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Admin God-Mode: Only this exact UUID or role should access
const ADMIN_UUID = process.env.ADMIN_USER_ID;

export default async function AdminOpsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (_error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data: { session }, error: _sessionError } = await supabase.auth.getSession();

  // If no session, or UUID doesn't match the admin, boot them
  if (!session || (ADMIN_UUID && session.user.id !== ADMIN_UUID)) {
    redirect('/');
  }

  // Fetch pending or expired stores
  const { data: stores, error: _error } = await supabase
    .from('stores')
    .select('id, name, slug, subscription_status, subscription_ends_at, city, user_id')
    .order('created_at', { ascending: false });

  async function activateStore(formData: FormData) {
    'use server';
    const storeId = formData.get('storeId') as string;
    const receiptId = formData.get('receiptId') as string;
    const addedDays = parseInt(formData.get('addedDays') as string, 10);
    const amountSyp = parseInt(formData.get('amountSyp') as string, 10) || 0;

    const cookieStoreServer = await cookies();
    // Requires SERVICE_ROLE to bypass RLS potentially, or admin auth
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
            getAll() { return cookieStoreServer.getAll(); },
            setAll(_cookiesToSet) { },
        }
      }
    );

    // Call our SQL RPC function from Sprint 1
    const { error: rpcError } = await supabaseAdmin.rpc('process_manual_payment', {
        p_store_id: storeId,
        p_receipt_id: receiptId,
        p_added_days: addedDays,
        p_payment_amount_syp: amountSyp
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error('Failed to activate store.');
    }

    // Force Next.js ISR cache invalidation
    revalidatePath('/admin/ops');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-arabic" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة تحكم الإدارة - الدفتر اليدوي</h1>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتجر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الانتهاء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تفعيل / تجديد</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores?.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{store.name}</span>
                        <span className="text-xs text-gray-500">/{store.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        store.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                        store.subscription_status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                      {store.subscription_status === 'active' ? 'نشط' :
                       store.subscription_status === 'suspended' ? 'معلق' : 'تجريبي'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {store.subscription_ends_at ? new Date(store.subscription_ends_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <form action={activateStore} className="flex gap-2 items-center">
                        <input type="hidden" name="storeId" value={store.id} />
                        <input
                            type="text"
                            name="receiptId"
                            placeholder="رقم الإيصال"
                            required
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 p-1.5 border"
                        />
                        <input
                            type="number"
                            name="addedDays"
                            defaultValue={365}
                            required
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 p-1.5 border"
                        />
                        <input
                            type="number"
                            name="amountSyp"
                            placeholder="المبلغ (ل.س)"
                            required
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-28 p-1.5 border"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            تأكيد الدفع
                        </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!stores || stores.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا يوجد متاجر حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
