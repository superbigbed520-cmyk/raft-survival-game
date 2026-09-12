// 任务系统模块

export const MissionType = {
    MAIN: 'main',
    DAILY: 'daily',
    ACHIEVEMENT: 'achievement',
};

const MAIN_MISSIONS = [
    {
        id: 'collect_planks',
        title: '收集木板',
        description: '收集10个木板',
        type: MissionType.MAIN,
        target: { type: 'plank', count: 10 },
        reward: { type: 'plank', count: 5 },
        completed: false,
    },
    {
        id: 'expand_raft',
        title: '扩建木筏',
        description: '将木筏扩建到5x5',
        type: MissionType.MAIN,
        target: { type: 'raft_size', count: 25 },
        reward: { type: 'rope', count: 5 },
        completed: false,
    },
    {
        id: 'first_catch',
        title: '初次钓鱼',
        description: '成功钓到一条鱼',
        type: MissionType.MAIN,
        target: { type: 'fish', count: 1 },
        reward: { type: 'food', count: 3 },
        completed: false,
    },
    {
        id: 'survive_night',
        title: '度过夜晚',
        description: '存活到下一个白天',
        type: MissionType.MAIN,
        target: { type: 'survive', count: 1 },
        reward: { type: 'metal', count: 2 },
        completed: false,
    },
];

export class MissionManager {
    constructor() {
        this.missions = [...MAIN_MISSIONS];
        this.completedCount = {
            plank: 0,
            raft_size: 9, // 初始3x3
            fish: 0,
            survive: 0,
        };
        this.lastTimeOfDay = 'day';
        this.raftSize = 9;
    }
    
    update(player, dayNight) {
        // 检查任务进度
        this.completedCount.plank = player.inventory.plank;
        this.completedCount.raft_size = this.raftSize;
        
        // 检查是否经历了昼夜变化
        if (this.lastTimeOfDay === 'night' && dayNight.currentTimeOfDay === 'day') {
            this.completedCount.survive++;
        }
        this.lastTimeOfDay = dayNight.currentTimeOfDay;
        
        // 检查任务完成
        let completedMission = null;
        this.missions.forEach(mission => {
            if (mission.completed) return;
            
            const progress = this.completedCount[mission.target.type] || 0;
            if (progress >= mission.target.count) {
                mission.completed = true;
                completedMission = mission;
            }
        });
        
        return completedMission;
    }
    
    setRaftSize(size) {
        this.raftSize = size;
    }
    
    getActiveMissions() {
        return this.missions.filter(m => !m.completed);
    }
    
    getCompletedMissions() {
        return this.missions.filter(m => m.completed);
    }
}
