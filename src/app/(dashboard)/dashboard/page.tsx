import { Briefcase, FileText, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="აქტიური ქეისები"
          value="24"
          change="+3 ამ კვირაში"
          changeType="up"
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="გადაუხდელი ინვოისები"
          value="€12,450"
          change="8 ინვოისი"
          changeType="warning"
          icon={FileText}
          color="amber"
        />
        <StatCard
          title="დასრულებული ქეისები"
          value="142"
          change="+12% წინა თვესთან"
          changeType="up"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="პარტნიორები"
          value="38"
          change="+2 ახალი"
          changeType="neutral"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">ბოლო ქეისები</h2>
            <a href="/cases" className="text-xs text-blue-500 hover:text-blue-600">
              ყველას ნახვა →
            </a>
          </div>
          <div className="space-y-3">
            {recentCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${caseItem.statusColor}`}>
                  <Briefcase size={16} className="text-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">{caseItem.number}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${caseItem.badgeColor}`}>
                      {caseItem.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{caseItem.patient}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">{caseItem.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">გადაუხდელი ინვოისები</h2>
            <a href="/invoices" className="text-xs text-blue-500 hover:text-blue-600">
              ყველას ნახვა →
            </a>
          </div>
          <div className="space-y-3">
            {pendingInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">{invoice.number}</p>
                  <p className="text-[11px] text-gray-500 truncate">{invoice.recipient}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">{invoice.amount}</p>
                  <p className="text-[10px] text-gray-400">{invoice.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">სწრაფი მოქმედებები</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon={Briefcase}
            label="ახალი ქეისი"
            href="/cases/new"
            color="blue"
          />
          <QuickAction
            icon={FileText}
            label="ახალი ინვოისი"
            href="/invoices/new"
            color="green"
          />
          <QuickAction
            icon={Users}
            label="ახალი პარტნიორი"
            href="/partners/new"
            color="purple"
          />
          <QuickAction
            icon={AlertTriangle}
            label="შეფერხებული"
            href="/cases?status=delayed"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'warning' | 'neutral';
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'ring-blue-500/10' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-500', ring: 'ring-emerald-500/10' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500', ring: 'ring-amber-500/10' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', ring: 'ring-purple-500/10' },
    red: { bg: 'bg-red-50', icon: 'text-red-500', ring: 'ring-red-500/10' },
  };

  const changeColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    warning: 'text-amber-500',
    neutral: 'text-gray-500',
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-gray-100/50 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${changeColors[changeType]}`}>
            {changeType === 'up' && <TrendingUp size={10} />}
            {change}
          </p>
        </div>
        <div className={`p-2.5 ${c.bg} rounded-lg ring-4 ${c.ring}`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
    </div>
  );
}

// Quick Action Component
interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function QuickAction({ icon: Icon, label, href, color }: QuickActionProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${colors[color]}`}
    >
      <Icon size={20} />
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}

// Mock Data
const recentCases = [
  {
    id: '1',
    number: 'GEO-2026-0142',
    patient: 'გიორგი მაისურაძე',
    status: 'მიმდინარე',
    statusColor: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-600',
    date: 'დღეს',
  },
  {
    id: '2',
    number: 'GEO-2026-0141',
    patient: 'ნინო კვარაცხელია',
    status: 'დასრულებული',
    statusColor: 'bg-emerald-50 text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    date: 'გუშინ',
  },
  {
    id: '3',
    number: 'GEO-2026-0140',
    patient: 'დავით ჩხეიძე',
    status: 'დრაფტი',
    statusColor: 'bg-gray-50 text-gray-600',
    badgeColor: 'bg-gray-100 text-gray-600',
    date: '10/01',
  },
  {
    id: '4',
    number: 'GEO-2026-0139',
    patient: 'ელენე წერეთელი',
    status: 'შეჩერებული',
    statusColor: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-600',
    date: '08/01',
  },
];

const pendingInvoices = [
  {
    id: '1',
    number: 'INV-202601-0022',
    recipient: 'Allianz Partners',
    amount: '€320',
    date: '09/01',
  },
  {
    id: '2',
    number: 'INV-202601-0021',
    recipient: 'AXA Assistance',
    amount: '€890',
    date: '08/01',
  },
  {
    id: '3',
    number: 'INV-202601-0019',
    recipient: 'Europ Assistance',
    amount: '€450',
    date: '05/01',
  },
];
