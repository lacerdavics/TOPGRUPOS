import { Users } from "lucide-react";

interface Group {
  id: string;
  name: string;
  category: string;
  membersCount?: number;
}

interface UserGroupsStatsProps {
  groups: Group[];
  totalGroups: number;
}

const UserGroupsStats = ({ groups, totalGroups }: UserGroupsStatsProps) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-card rounded-xl p-6 border shadow-sm max-w-md w-full">
        <div className="flex items-center space-x-4 justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{totalGroups}</p>
            <p className="text-sm text-muted-foreground">Grupos Cadastrados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGroupsStats;