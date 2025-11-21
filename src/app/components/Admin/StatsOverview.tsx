import {
    FileText,
    Users,
    CheckCircle,
    Clock,
    Laptop,
    MapPin,
} from 'lucide-react';

interface StatsData {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    desktop: number;
    onsite: number;
    recentSubmissions: number;
}

type Status = 'completed' | 'processing' | 'pending';

const statusMapping: Record<string, Status> = {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
};

export const StatsOverview = ({ data }: { data: StatsData }) => {
    // Default data structure if none provided
    const stats = data || {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        desktop: 0,
        onsite: 0,
        recentSubmissions: 0,
    };

    // Calculate percentages and trends
    const completionRate =
        stats.total > 0
            ? ((stats.completed / stats.total) * 100).toFixed(1)
            : 0;

    const pendingPercentage =
        stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(0) : 0;
    
    const numberOfClaimsAdded =
        stats.total > 0 ? ((stats.recentSubmissions / stats.total) * 100).toFixed(0) : 0;
    

    const statsConfig = [
        {
            icon: FileText,
            iconColor: 'text-amber-500',
            value: stats.total,
            label: 'Total Requests',
            trend: `${numberOfClaimsAdded}%`,
            trendColor: 'text-green-400',
        },
        {
            icon: Clock,
            iconColor: 'text-yellow-500',
            value: stats.pending,
            label: 'Pending',
            trend: `${pendingPercentage}%`,
            trendColor: 'text-yellow-400',
        },
        {
            icon: CheckCircle,
            iconColor: 'text-green-500',
            value: `${completionRate}%`,
            label: 'Completion Rate',
            trend: `${completionRate}%`,
            trendColor: 'text-green-400',
        },
    ];

    const recentActivities = [
        {
            id: 1,
            type: 'desktop',
            count: stats.desktop,
            label: 'Desktop Requests',
            icon: Laptop,
            status: 'pending',
        },
        {
            id: 2,
            type: 'onsite',
            count: stats.onsite,
            label: 'Onsite Requests',
            icon: MapPin,
            status: 'processing',
        },
        {
            id: 3,
            type: 'completed',
            count: stats.completed,
            label: 'Completed',
            icon: CheckCircle,
            status: 'completed',
        },
    ];

    const getStatusColor = (status: Status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'processing':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    return (
        <div className="w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statsConfig.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <IconComponent
                                    className={`w-8 h-8 ${stat.iconColor}`}
                                />
                                <span
                                    className={`${stat.trendColor} text-sm font-medium`}
                                >
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                    Request Breakdown
                </h3>
                <div className="space-y-4">
                    {recentActivities.map(activity => {
                        const IconComponent = activity.icon;
                        return (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                        <IconComponent className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {activity.label}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {activity.count} request
                                            {activity.count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                        activity.status as Status
                                    )}`}
                                >
                                    {activity.status.charAt(0).toUpperCase() +
                                        activity.status.slice(1)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
