import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineStage } from '../../types';
import { getStatusConfig } from '../../lib/constants';

interface StageTrackerProps {
    stages: PipelineStage[];
    currentStageId: string | null;
    onStageChange: (stageId: string) => void;
}

export default function StageTracker({ stages, currentStageId, onStageChange }: StageTrackerProps) {
    if (!stages || stages.length === 0) return null;

    const currentIndex = stages.findIndex(s => s.id === currentStageId);

    return (
        <div className="w-full flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {stages.map((stage, index) => {
                const isCurrent = currentStageId === stage.id;
                const isPast = currentIndex > index;
                const isLast = index === stages.length - 1;

                const stageConfig = getStatusConfig(stage.name);

                // Determine colors based on state
                let bgColor = 'bg-white hover:bg-gray-50';
                let textColor = 'text-gray-500 hover:text-gray-700';
                let iconColor = 'text-gray-300';
                let chevronColor = 'text-gray-300';

                if (isCurrent) {
                    bgColor = cn(stageConfig.bg, "bg-opacity-50 hover:bg-opacity-80");
                    textColor = cn(stageConfig.color, "font-bold");
                    iconColor = stageConfig.color;
                    chevronColor = cn(stageConfig.color, "opacity-30");
                } else if (isPast) {
                    bgColor = 'bg-white hover:bg-gray-50';
                    textColor = 'text-gray-800 font-medium';
                    iconColor = 'text-green-500';
                    chevronColor = 'text-gray-200';
                }

                return (
                    <button
                        key={stage.id}
                        onClick={() => onStageChange(stage.id)}
                        className={cn(
                            "relative flex-1 flex items-center justify-center py-2.5 px-2 transition-colors",
                            bgColor,
                            textColor
                        )}
                        title={stage.name}
                    >
                        <div className="flex items-center gap-2 z-10 truncate px-2">
                            {isPast && !isCurrent ? (
                                <Check className={cn("w-3.5 h-3.5 shrink-0", iconColor)} strokeWidth={3} />
                            ) : (
                                <span className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                                    isCurrent ? cn(stageConfig.bar, "text-white") : "border border-gray-300 text-gray-400"
                                )}>
                                    {index + 1}
                                </span>
                            )}
                            <span className="text-xs truncate max-w-[100px] xl:max-w-none">{stage.name}</span>
                        </div>

                        {!isLast && (
                            <div className="absolute right-0 top-0 bottom-0 flex items-center translate-x-1/2 z-20 pointer-events-none">
                                <ChevronRight className={cn("w-4 h-4", chevronColor)} />
                            </div>
                        )}
                        {!isLast && (
                            <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200 z-0"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
