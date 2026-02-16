declare module 'lucide-react-native' {
  import { FC, SVGProps } from 'react';

  interface IconProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: number | string;
    strokeWidth?: number;
  }

  export const Home: FC<IconProps>;
  export const ListTodo: FC<IconProps>;
  export const Bot: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const Circle: FC<IconProps>;
  export const Activity: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const Zap: FC<IconProps>;
  export const TrendingUp: FC<IconProps>;
  export const Star: FC<IconProps>;
  export const Send: FC<IconProps>;
}
