import React from 'react';

const idPrefix = (id: string): string => id.split('.')[0] || id;

const hueFromString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 360;
  }
  return h;
};

type Props = {
  id: string;
};

const IdBadge: React.FC<Props> = ({ id }) => {
  const prefix = idPrefix(id).toUpperCase();
  const hue = hueFromString(prefix);

  const style: React.CSSProperties = {
    backgroundColor: `hsl(${hue} 70% 94%)`,
    border: `1px solid hsl(${hue} 55% 55%)`,
    color: `hsl(${hue} 55% 30%)`,
  };

  return (
    <span className="badge" style={style} title={prefix}>
      {id}
    </span>
  );
};

export default IdBadge;

