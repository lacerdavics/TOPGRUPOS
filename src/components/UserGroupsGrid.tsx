import UserGroupCard from "./UserGroupCard";

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  membersCount?: number;
  imageUrl?: string;
  telegramUrl?: string;
}

interface UserGroupsGridProps {
  groups: Group[];
  loading: boolean;
  onPromote: (groupId: string) => void;
  onEdit: (groupId: string) => void;
  onGroupUpdate?: () => void;
}

const UserGroupsGrid = ({ groups, loading, onPromote, onEdit, onGroupUpdate }: UserGroupsGridProps) => {
  if (loading) {
    return (
      <div className="grid-responsive-cards">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-card rounded-xl p-4 border animate-pulse h-80">
            <div className="flex flex-col space-y-3 h-full">
              <div className="w-full h-32 bg-muted rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-muted rounded flex-1"></div>
                <div className="h-8 w-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhum grupo cadastrado</h3>
        <p className="text-muted-foreground">
          Você ainda não cadastrou nenhum grupo. Que tal começar agora?
        </p>
      </div>
    );
  }

  return (
    <div className="grid-responsive-cards">
      {groups.map((group) => (
        <UserGroupCard
          key={group.id}
          group={group}
          onPromote={onPromote}
          onEdit={onEdit}
          onGroupUpdate={onGroupUpdate}
        />
      ))}
    </div>
  );
};

export default UserGroupsGrid;