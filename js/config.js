
/*
=========================================================
MatchIQ
config.js
Version: 0.6.0
=========================================================
*/

const MatchIQ = {

    app: {

        name: "MatchIQ",

        version: "0.6.0",

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
            id: "circleEntry",
            name: "Circle Entry",
            icon: "⭕",
            category: "attack"
        },

        {
            id: "shot",
            name: "Shot",
            icon: "🎯",
            category: "attack"
        },

        {
            id: "goalScored",
            name: "Goal Scored",
            icon: "🥅",
            category: "attack"
        },

        {
            id: "pcWon",
            name: "Penalty Corner Won",
            icon: "🚩",
            category: "attack"
        },

        {
            id: "psWon",
            name: "Penalty Stroke Won",
            icon: "🏑",
            category: "attack"
        },

        {
            id: "highTurnoverWon",
            name: "High Turnover Won",
            icon: "⬆️",
            category: "attack"
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

        /*
        =====================================================
        DEFENCE
        =====================================================
        */

        {
            id: "goalConceded",
            name: "Goal Conceded",
            icon: "⚽",
            category: "defence"
        },

        {
            id: "save",
            name: "Goalkeeper Save",
            icon: "🧤",
            category: "defence"
        },

        {
            id: "interception",
            name: "Interception",
            icon: "🛡️",
            category: "defence"
        },

        {
            id: "turnoverWon",
            name: "Turnover Won",
            icon: "✅",
            category: "defence"
        },

        {
            id: "turnoverLost",
            name: "Turnover Lost",
            icon: "❌",
            category: "defence"
        },

        {
            id: "pcConceded",
            name: "Penalty Corner Conceded",
            icon: "🚩",
            category: "defence"
        },

        {
            id: "psConceded",
            name: "Penalty Stroke Conceded",
            icon: "⚠️",
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
