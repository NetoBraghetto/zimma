import { TbChartArcs3 } from "react-icons/tb";

export function AppLoading() {
  return (
    <div className="flex flex-col h-dvh w-dvw gap-6 items-center pt-40 animate-pulse">
      <div>
        <TbChartArcs3 className="animate-bounce size-20 text-muted-foreground" />
      </div>
      <div className="uppercase font-black text-muted-foreground text-4xl max-w-87.5 text-center">Iniciando</div>
    </div>
  );
}
