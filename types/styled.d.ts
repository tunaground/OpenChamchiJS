import "styled-components";
import { AppTheme } from "@/lib/theme/themes";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
