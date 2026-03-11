import React from 'react';
import type { TabId } from '@/types/dashboard';
import { TABS } from '@/constants/chartConfigs';

// ============================================================
// TabNav — barra de navegação entre abas
// ============================================================
interface TabNavProps {
    activeTab: TabId;
    onChange: (tab: TabId) => void;
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
    return (
        <div className="bg-gray-100 px-2 py-2 overflow-x-auto flex space-x-1 sticky top-[57px] z-30">
            {TABS.map(({ id, label }) => {
                const isActive = activeTab === id;
                return (
                    <button
                        key={id}
                        onClick={() => onChange(id as TabId)}
                        className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${isActive ? "bg-white font-semibold border-t-2 border-x-2" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        style={
                            isActive
                                ? {
                                    color: "#38B3AB",
                                    borderColor: "#38B3AB",
                                }
                                : {}
                        }
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
