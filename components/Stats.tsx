
import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface Props {
  active: boolean;
}

export const Stats: React.FC<Props> = ({ active }) => {
  const data = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      time: i,
      val: active ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 5)
    }));
  }, [active]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke="#4f46e5" 
            fillOpacity={1} 
            fill="url(#colorVal)" 
            strokeWidth={2}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
