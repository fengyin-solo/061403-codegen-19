<template>
  <div class="action-panel">
    <h3 class="panel-title">行动</h3>
    <div v-if="isNight" class="night-warning">
      <span>🌙 夜晚无法外出活动，请保持温暖！</span>
    </div>

    <div class="fishing-status" v-if="!isNight">
      <div class="status-title">🎣 冰湖捕鱼</div>
      <div class="status-row">
        <span class="status-label">冰洞:</span>
        <span :class="iceHoleDug ? 'status-ok' : 'status-no'">{{ iceHoleDug ? '✓ 已凿开' : '✗ 未开凿' }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">渔网:</span>
        <span :class="netDeployed ? 'status-ok' : 'status-no'">
          {{ netDeployed ? `✓ 已布下 (${netDeployedDays}天)` : '✗ 未布网' }}
        </span>
      </div>
      <div class="status-row" v-if="netDeployed">
        <span class="status-label">加成:</span>
        <span class="status-bonus">x{{ fishingBonus.toFixed(2) }}</span>
      </div>
    </div>

    <div class="actions-grid">
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver }"
        @click="$emit('chop')"
      >
        <span class="btn-icon">🪓</span>
        <span class="btn-text">砍柴</span>
        <span class="btn-cost">-5 体温</span>
      </button>
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver || !canHunt }"
        @click="$emit('hunt')"
      >
        <span class="btn-icon">🏹</span>
        <span class="btn-text">狩猎</span>
        <span class="btn-cost">-8 体温</span>
        <span class="btn-hint">{{ canHunt ? '成功率: ' + Math.round(huntRate * 100) + '%' : '需先制作工具' }}</span>
      </button>
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver || !canCraft }"
        @click="$emit('craft')"
      >
        <span class="btn-icon">🔨</span>
        <span class="btn-text">制作工具</span>
        <span class="btn-cost">-6 体温</span>
        <span class="btn-hint">需要: 2🪵 + 1🦊</span>
      </button>
      <button 
        class="action-btn fire-btn" 
        :class="{ disabled: !canFire || gameOver }"
        @click="$emit('fire')"
      >
        <span class="btn-icon">🔥</span>
        <span class="btn-text">生火</span>
        <span class="btn-cost">-3 木头</span>
        <span class="btn-hint">+25~45 热量</span>
      </button>
      <button 
        class="action-btn food-btn" 
        :class="{ disabled: food <= 0 || gameOver }"
        @click="$emit('eat')"
      >
        <span class="btn-icon">🍖</span>
        <span class="btn-text">进食</span>
        <span class="btn-cost">-1 食物</span>
        <span class="btn-hint">+5~15 体温</span>
      </button>

      <button 
        class="action-btn dig-btn" 
        :class="{ disabled: isNight || gameOver || !canDigHole }"
        @click="$emit('dig')"
      >
        <span class="btn-icon">⛏️</span>
        <span class="btn-text">① 打冰洞</span>
        <span class="btn-cost">-10 体温</span>
        <span class="btn-hint">
          {{ iceHoleDug ? '✓ 已完成' : (canDigHole ? '准备就绪' : '需要: 1🔪 + 1🪵') }}
        </span>
      </button>
      <button 
        class="action-btn net-btn" 
        :class="{ disabled: isNight || gameOver || !canDeploy }"
        @click="$emit('deploy')"
      >
        <span class="btn-icon">🕸️</span>
        <span class="btn-text">② 布渔网</span>
        <span class="btn-cost">-8 体温</span>
        <span class="btn-hint">
          {{ netDeployed ? '✓ 已完成' : (!iceHoleDug ? '先打冰洞' : (canDeploy ? '准备就绪' : '需: 2🪵 + 1🦊')) }}
        </span>
      </button>
      <button 
        class="action-btn harvest-btn" 
        :class="{ disabled: isNight || gameOver || !canHarvest }"
        @click="$emit('harvest')"
      >
        <span class="btn-icon">🐟</span>
        <span class="btn-text">③ 收网</span>
        <span class="btn-cost">-6 体温</span>
        <span class="btn-hint">
          {{ !netDeployed ? '先布渔网' : (canHarvest ? '可收获食物！' : '等待第 ' + (netDeployDay + 1) + ' 天') }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isNight: { type: Boolean, default: false },
  gameOver: { type: Boolean, default: false },
  canFire: { type: Boolean, default: false },
  canCraft: { type: Boolean, default: false },
  canHunt: { type: Boolean, default: false },
  huntRate: { type: Number, default: 0.3 },
  food: { type: Number, default: 0 },
  iceHoleDug: { type: Boolean, default: false },
  netDeployed: { type: Boolean, default: false },
  netDeployDay: { type: Number, default: 0 },
  netDeployedDays: { type: Number, default: 0 },
  canDigHole: { type: Boolean, default: false },
  canDeploy: { type: Boolean, default: false },
  canHarvest: { type: Boolean, default: false },
  fishingBonus: { type: Number, default: 1.0 }
})

defineEmits(['chop', 'hunt', 'craft', 'fire', 'eat', 'dig', 'deploy', 'harvest'])
</script>

<style scoped>
.action-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  color: white;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.night-warning {
  background: rgba(50, 50, 100, 0.8);
  border: 1px solid rgba(100, 100, 200, 0.5);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 15px;
  text-align: center;
  color: #a0c4ff;
  font-size: 14px;
}

.fishing-status {
  background: rgba(100, 180, 255, 0.15);
  border: 1px solid rgba(100, 180, 255, 0.3);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 15px;
}

.status-title {
  color: #a0d8ff;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 3px 0;
}

.status-label {
  color: rgba(255, 255, 255, 0.7);
}

.status-ok {
  color: #6bff9e;
  font-weight: bold;
}

.status-no {
  color: rgba(255, 255, 255, 0.5);
}

.status-bonus {
  color: #ffd700;
  font-weight: bold;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 15px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.action-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.action-btn:active:not(.disabled) {
  transform: translateY(-1px);
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.fire-btn:not(.disabled) {
  border-color: rgba(255, 100, 50, 0.6);
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.3), rgba(255, 50, 0, 0.1));
}

.fire-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(255, 100, 50, 0.4);
}

.food-btn:not(.disabled) {
  border-color: rgba(50, 200, 100, 0.6);
  background: linear-gradient(135deg, rgba(50, 200, 100, 0.3), rgba(0, 150, 50, 0.1));
}

.food-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(50, 200, 100, 0.4);
}

.dig-btn:not(.disabled) {
  border-color: rgba(150, 150, 200, 0.6);
  background: linear-gradient(135deg, rgba(120, 120, 180, 0.3), rgba(80, 80, 140, 0.1));
}

.dig-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(150, 150, 200, 0.4);
}

.net-btn:not(.disabled) {
  border-color: rgba(100, 200, 220, 0.6);
  background: linear-gradient(135deg, rgba(80, 180, 200, 0.3), rgba(50, 140, 160, 0.1));
}

.net-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(100, 200, 220, 0.4);
}

.harvest-btn:not(.disabled) {
  border-color: rgba(255, 200, 80, 0.6);
  background: linear-gradient(135deg, rgba(255, 200, 50, 0.3), rgba(200, 150, 30, 0.1));
}

.harvest-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(255, 200, 80, 0.4);
}

.btn-icon {
  font-size: 28px;
}

.btn-text {
  font-size: 14px;
  font-weight: bold;
}

.btn-cost {
  font-size: 11px;
  color: rgba(255, 150, 150, 0.9);
}

.btn-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
