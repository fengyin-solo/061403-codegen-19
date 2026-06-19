import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const blizzardStage = ref(0)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const iceHoleDug = ref(false)
  const netDeployed = ref(false)
  const netDeployDay = ref(0)

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const HEAT_CONSUMPTION_RATE = 2
  const BLIZZARD_CHANCE = 0.15

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30)
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const huntSuccessRate = computed(() => 0.3 + tools.value * 0.15)

  const canDigIceHole = computed(() => !iceHoleDug.value && tools.value >= 1 && wood.value >= 1)
  const canDeployNet = computed(() => iceHoleDug.value && !netDeployed.value && wood.value >= 2 && hide.value >= 1)
  const canHarvestNet = computed(() => netDeployed.value && dayCount.value > netDeployDay.value)
  const fishingYieldBonus = computed(() => {
    let bonus = 1
    bonus += tools.value * 0.1
    if (temperature.value >= 50 && temperature.value <= 80) {
      bonus += 0.3
    } else if (temperature.value >= 30) {
      bonus += 0.1
    } else if (temperature.value < 20) {
      bonus -= 0.3
    }
    if (isBlizzard.value) {
      bonus -= 0.2 * (1 + blizzardStage.value * 0.1)
    }
    return Math.max(0.2, bonus)
  })

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    actionLog.value.unshift({ message, type, timestamp })
    if (actionLog.value.length > 20) {
      actionLog.value.pop()
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      addLog('游戏结束：体温过低！', 'danger')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const consumption = HEAT_CONSUMPTION_RATE * multiplier
    
    if (heat.value >= consumption) {
      heat.value -= consumption
      if (temperature.value < 80) {
        temperature.value = Math.min(80, temperature.value + 1)
      }
    } else {
      heat.value = 0
      temperature.value = Math.max(0, temperature.value - consumption)
      addLog('热量不足！体温正在下降...', 'warning')
    }
    
    checkGameOver()
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)
    
    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    isBlizzard.value = false
    blizzardStage.value = 0
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    blizzardStage.value = Math.min(blizzardStage.value + 1, 5)
    addLog(`⚠️ 暴风雪来袭（阶段 ${blizzardStage.value}）！所有消耗加倍！`, 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 5 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    const woodGained = Math.floor(Math.random() * 3) + 2
    wood.value += woodGained
    
    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温`, 'action')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return
    if (!canHunt.value) {
      addLog('需要至少 1 件工具才能进行狩猎！', 'warning')
      return
    }
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 8 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    if (Math.random() < huntSuccessRate.value) {
      const foodGained = Math.floor(Math.random() * 3) + 2
      const hideGained = Math.floor(Math.random() * 2) + 1
      food.value += foodGained
      hide.value += hideGained
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温`, 'success')
    } else {
      addLog(`狩猎失败：消耗 ${tempCost} 体温，空手而归`, 'warning')
    }
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier
    
    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温`, 'success')
    checkGameOver()
  }

  function digIceHole() {
    if (gameOver.value || isNight.value) return
    if (gameOver.value) return
    if (iceHoleDug.value) {
      addLog('冰洞已经打好了，无需重复开凿！', 'warning')
      return
    }
    if (tools.value < 1) {
      addLog('⛏️ 缺少工具：需要先制作至少 1 件工具才能开凿冰洞', 'warning')
      return
    }
    if (wood.value < 1) {
      addLog('🪵 材料不足：打冰洞需要 1 木头加固洞口边缘', 'warning')
      return
    }
    if (!canDigIceHole.value) {
      addLog('当前条件不满足打冰洞要求', 'warning')
      return
    }

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 10 * multiplier

    wood.value -= 1
    iceHoleDug.value = true
    temperature.value = Math.max(0, temperature.value - tempCost)

    addLog(`⛏️ 打冰洞成功：在冰面上凿开了捕鱼洞口`, 'success')
    addLog(`  消耗：${tempCost} 体温 + 1 木头`, 'action')

    if (Math.random() < BLIZZARD_CHANCE * 0.3) {
      triggerBlizzard()
    }

    checkGameOver()
  }

  function deployFishingNet() {
    if (gameOver.value || isNight.value) return
    if (!iceHoleDug.value) {
      addLog('🕸️ 流程错误：请先完成「打冰洞」才能布网捕鱼', 'warning')
      return
    }
    if (netDeployed.value) {
      addLog('🕸️ 渔网已经布下，等待明天收网即可', 'warning')
      return
    }
    if (wood.value < 2) {
      addLog('🪵 材料不足：制作并布下渔网需要 2 木头', 'warning')
      return
    }
    if (hide.value < 1) {
      addLog('🦊 材料不足：制作并布下渔网需要 1 兽皮', 'warning')
      return
    }
    if (!canDeployNet.value) {
      addLog('当前条件不满足布网要求', 'warning')
      return
    }

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 8 * multiplier

    wood.value -= 2
    hide.value -= 1
    netDeployed.value = true
    netDeployDay.value = dayCount.value
    temperature.value = Math.max(0, temperature.value - tempCost)

    addLog(`🕸️ 布网成功：渔网已沉入冰洞水中`, 'success')
    addLog(`  消耗：${tempCost} 体温 + 2 木头 + 1 兽皮`, 'action')
    addLog(`  提示：需等到第 ${dayCount.value + 1} 天才能收网，多等一天产量 +1`, 'info')

    if (Math.random() < BLIZZARD_CHANCE * 0.3) {
      triggerBlizzard()
    }

    checkGameOver()
  }

  function harvestFishingNet() {
    if (gameOver.value || isNight.value) return
    if (!netDeployed.value) {
      addLog('🐟 流程错误：冰洞中还没有渔网，请先完成「布网」', 'warning')
      return
    }
    if (dayCount.value <= netDeployDay.value) {
      addLog(`🐟 时间不够：渔网必须浸泡一夜才能收网，请第 ${netDeployDay.value + 1} 天再来`, 'warning')
      return
    }
    if (!canHarvestNet.value) {
      addLog('当前条件不满足收网要求', 'warning')
      return
    }

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier
    temperature.value = Math.max(0, temperature.value - tempCost)

    const daysWaited = dayCount.value - netDeployDay.value
    const baseYield = 2 + daysWaited
    const finalYield = Math.max(1, Math.round(baseYield * fishingYieldBonus.value))

    food.value += finalYield
    netDeployed.value = false
    netDeployDay.value = 0

    let yieldBreakdown = []
    if (tools.value > 0) yieldBreakdown.push(`工具 x${tools.value}: +${(tools.value * 0.1 * 100).toFixed(0)}%`)
    if (temperature.value >= 50 && temperature.value <= 80) yieldBreakdown.push('适宜气温: +30%')
    else if (temperature.value >= 30) yieldBreakdown.push('一般气温: +10%')
    else if (temperature.value < 20) yieldBreakdown.push('严寒低温: -30%')
    if (isBlizzard.value) yieldBreakdown.push(`暴风雪 Lv.${blizzardStage.value}: -${((0.2 * (1 + blizzardStage.value * 0.1)) * 100).toFixed(0)}%`)

    const blizzardInfo = isBlizzard.value ? `（暴风雪阶段 ${blizzardStage.value}）` : ''
    addLog(`🐟 收网成功${blizzardInfo}：获得 ${finalYield} 食物`, 'success')
    addLog(`  消耗：${tempCost} 体温 | 等待 ${daysWaited} 天 | 基础产量 ${baseYield}`, 'action')
    addLog(`  加成明细: x${fishingYieldBonus.value.toFixed(2)} (${yieldBreakdown.join('、') || '无特殊加成'})`, 'info')

    if (Math.random() < BLIZZARD_CHANCE * 0.2) {
      triggerBlizzard()
    }

    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }
    
    wood.value -= 3
    const heatGained = Math.floor(Math.random() * 20) + 25
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)
    
    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }
    
    food.value -= 1
    const tempGained = Math.floor(Math.random() * 10) + 5
    temperature.value = Math.min(100, temperature.value + tempGained)
    
    addLog(`进食：体温恢复 ${tempGained}`, 'success')
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)
    
    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      blizzardStage: blizzardStage.value,
      iceHoleDug: iceHoleDug.value,
      netDeployed: netDeployed.value,
      netDeployDay: netDeployDay.value,
      savedAt: Date.now()
    }
    localStorage.setItem(`snowSurvival_${slot}`, JSON.stringify(gameState))
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      addLog('没有找到存档', 'warning')
      return false
    }
    
    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature
      heat.value = gameState.heat
      wood.value = gameState.wood
      food.value = gameState.food
      hide.value = gameState.hide
      tools.value = gameState.tools
      isDay.value = gameState.isDay
      dayCount.value = gameState.dayCount
      isBlizzard.value = gameState.isBlizzard
      blizzardStage.value = gameState.blizzardStage || 0
      iceHoleDug.value = gameState.iceHoleDug || false
      netDeployed.value = gameState.netDeployed || false
      netDeployDay.value = gameState.netDeployDay || 0
      gameOver.value = false
      gameOverReason.value = ''
      actionLog.value = []
      
      stopTimers()
      startTimers()
      
      if (!isDay.value) {
        startNightCycle()
      }
      
      addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  function getSaveSlots() {
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const data = JSON.parse(localStorage.getItem(key))
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt
          })
        } catch (e) {}
      }
    }
    return slots
  }

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    addLog(`已删除存档：${slot}`, 'info')
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    blizzardStage.value = 0
    iceHoleDug.value = false
    netDeployed.value = false
    netDeployDay.value = 0
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []
    
    stopTimers()
    startTimers()
    
    addLog('新游戏开始！祝你好运！', 'success')
  }

  onMounted(() => {
    startTimers()
    addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。', 'info')
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    blizzardStage,
    iceHoleDug,
    netDeployed,
    netDeployDay,
    gameOver,
    gameOverReason,
    actionLog,
    isDanger,
    canMakeFire,
    canHunt,
    huntSuccessRate,
    canDigIceHole,
    canDeployNet,
    canHarvestNet,
    fishingYieldBonus,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    digIceHole,
    deployFishingNet,
    harvestFishingNet,
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    restartGame
  }
}
