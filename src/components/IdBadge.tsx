type IdBadgeProps = {
  id: string;
};

const IdBadge = ({ id }: IdBadgeProps) => (
  <span className="id-badge">{id}</span>
);

export default IdBadge;
