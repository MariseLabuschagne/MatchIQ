
/*
=========================================================
MatchIQ
config.js
Version: 1.0.1
=========================================================
*/

const MatchIQ = {

    app: {

        name: "MatchIQ",

        version: "1.1.0",

        company: "MatchIQ"

    },

    categories: [

        {
            id: "attack",
            name: "Attack"
        },

        {
            id: "defence",
            name: "Defence"
        },

        {
            id: "discipline",
            name: "Discipline"
        }

    ],

    events: [

        /*
        =====================================================
        ATTACK
        =====================================================
        */

        
        {
            id: "attackStart",
            name: "Circle Entry",
            icon: "⭕",
            category: "attack"
        },

        {
            id: "longCorner",
            name: "Long Corner",
            icon: "🚩",
            category: "attack"
        },
        {
            id: "restart16",
            name: "16",
            icon: "▶",
            category: "attack"
        },

        {
            id: "turnoverMidfield",
            name: "Turnover Midfield",
            icon: "⬆️",
            category: "attack"
        },
        
        {
            id: "turnoverAttacking25",
            name: "Turnover Attacking 25",
            icon: "⬆️",
            category: "attack"
        },

        {
            id: "turnoverDefensive25",
            name: "Turnover Defensive 25",
            icon: "⬆️",
            category: "attack"
        },


        {
            id: "goalScored",
            name: "Goal Scored",
            icon: "🥅",
            category: "system"
        },

        {
            id: "pcWon",
            name: "Penalty Corner Won",
            icon: "🚩",
            category: "system"
        },   

        /*
        =====================================================
        ATTACK ENTRY LOCATIONS
        =====================================================
        */

        {
            id: "entryLeft",
            name: "Entry Left",
            icon: "⬅️",
            category: "system"
        },

        {
            id: "entryTopD",
            name: "Entry Top D",
            icon: "⬆️",
            category: "system"
        },

        {
            id: "entryRight",
            name: "Entry Right",
            icon: "➡️",
            category: "system"
        },

                
        /*
        =====================================================
        ATTACK ENTRY OUTCOMES
        =====================================================
        */

        {
            id: "entryShot",
            name: "Shot",
            icon: "🎯",
            category: "system"
        },

        {
            id: "entryPenaltyCorner",
            name: "Penalty Corner",
            icon: "🚩",
            category: "system"
        },

{
            id: "psWon",
            name: "Penalty Stroke Won",
            icon: "🏑",
            category: "system"
        },

        {
            id: "entryLongCorner",
            name: "Long Corner",
            icon: "↩️",
            category: "system"
        },

        {
            id: "entryTurnoverLost",
            name: "Turnover Lost",
            icon: "❌",
            category: "system"
        },
            
        
        {
            id: "pcRepeated",
            name: "Penalty Corner Re-awarded",
            icon: "🚩",
            category: "system"
        },


        /*
        =====================================================
        HIDDEN ATTACK EVENTS
        =====================================================
        */

        {
            id: "shotOnTarget",
            name: "Shot On Target",
            icon: "🎯",
            category: "system"
        },

        {
            id: "shotOffTarget",
            name: "Shot Off Target",
            icon: "⚪",
            category: "system"
        },

        {
            id: "shotBlocked",
            name: "Shot Blocked",
            icon: "🛑",
            category: "system"
        },
        
        {
            id: "pcGoal",
            name: "PC Goal",
            icon: "🥅",
            category: "system"
        },

        {
            id: "pcSaved",
            name: "PC Saved",
            icon: "🧤",
            category: "system"
        },

        {
            id: "pcMissed",
            name: "PC Missed",
            icon: "❌",
            category: "system"
        },

        {
            id: "pcBrokenDown",
            name: "PC Broken Down",
            icon: "⚠️",
            category: "system"
        },
        
        {
            id: "pcReAwarded",
            name: "PC Re-Awarded",
            icon: "🚩",
            category: "system"
        },
        

        
        /*
        =====================================================
        ATTACK JOURNEY
        ENTRY LOCATIONS
        =====================================================
        */

        {
            id: "entryLeft",
            name: "Entry Left",
            icon: "⬅️",
            category: "system"
        },

        {
            id: "entryTopD",
            name: "Entry Top D",
            icon: "⬆️",
            category: "system"
        },

        {
            id: "entryRight",
            name: "Entry Right",
            icon: "➡️",
            category: "system"
        },

        /*
        =====================================================
        DEFENCE
        =====================================================
        */
        
        {
            id: "defenceEntry",
            name: "Circle Entry Against",
            icon: "⭕",
            category: "defence"
        },
        
        {
            id: "longCornerAgainst",
            name: "Long Corner Against",
            icon: "🚩",
            category: "defence"
        },
        {
            id: "restart16Against",
            name: "16 Against",
            icon: "▶",
            category: "defence"
        },
        
        {
            id: "defenceEntryLeft",
            name: "Defence Entry Left",
            icon: "⬅️",
            category: "system"
        },

        {
            id: "defenceEntryTopD",
            name: "Defence Entry Top D",
            icon: "⬆️",
            category: "system"
        },

        {
            id: "defenceEntryRight",
            name: "Defence Entry Right",
            icon: "➡️",
            category: "system"
        },
                
        {
            id: "goalConceded",
            name: "Goal Conceded",
            icon: "🥅",
            category: "system"
        },

        {
            id: "save",
            name: "Goalkeeper Save",
            icon: "🧤",
            category: "system"
        },
        
        {
            id: "pcConceded",
            name: "Penalty Corner Conceded",
            icon: "🚩",
            category: "system"
        },
        
        {
            id: "pcGoalConceded",
            name: "PC Goal Conceded",
            icon: "🥅",
            category: "system"
        },

        {
            id: "pcFirstWaveSave",
            name: "PC First Wave Save",
            icon: "🛑",
            category: "system"
        },

        {
            id: "pcGoalkeeperSave",
            name: "PC Goalkeeper Save",
            icon: "🧤",
            category: "system"
        },

        {
            id: "pcSecondWaveSave",
            name: "PC Second Wave Save",
            icon: "✅",
            category: "system"
        },

        {
            id: "psConceded",
            name: "Penalty Stroke Conceded",
            icon: "🏑",
            category: "system"
        },

        {
            id: "turnoverWonDefence",
            name: "Turnover Won",
            icon: "✅",
            category: "system"
        },
    
        {
            id: "turnoverMidfieldLost",
            name: "Turnover Midfield",
            icon: "⬆️",
            category: "defence"
        },
        
        {
            id: "turnoverAttacking25Lost",
            name: "Turnover Attacking 25",
            icon: "⬆️",
            category: "defence"
        },

        {
            id: "turnoverDefensive25Lost",
            name: "Turnover Defensive 25",
            icon: "⬆️",
            category: "defence"
        },

         /*
        =====================================================
        HIDDEN DEFENCE EVENTS
        =====================================================
        */
        
        {
            id: "pcConcededLow",
            name: "PC Conceded Low",
            icon: "⬇️",
            category: "system"
        },

        {
            id: "pcConcededHigh",
            name: "PC Conceded High",
            icon: "⬆️",
            category: "system"
        },


        /*
        =====================================================
        DISCIPLINE
        =====================================================
        */

        {
            id: "greenCard",
            name: "Green Card",
            icon: "🟩",
            category: "discipline"
        },

        {
            id: "yellowCard",
            name: "Yellow Card",
            icon: "🟨",
            category: "discipline"
        },

        {
            id: "redCard",
            name: "Red Card",
            icon: "🟥",
            category: "discipline"
        },

        /*
        =====================================================
        SYSTEM
        =====================================================
        */

        {
            id: "periodChanged",
            name: "Period Changed",
            icon: "⏭",
            category: "system"
        }

    ]

};
