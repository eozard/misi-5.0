import { Users, CheckCircle, Clock } from "lucide-react";

const iconMap = {
  users: Users,
  check: CheckCircle,
  clock: Clock,
};

const colorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
};

const StatsCard = ({ 
  title, 
  value, 
  icon = "users", 
  color = "blue",
  className = ""
}) => {
  const Icon = iconMap[icon] || Users;
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center gap-3 ${className}`}>
      <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
