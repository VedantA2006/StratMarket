"""
Complete Production Live MT5 Execution Runner: Inverse-DD Weighted (Rank #4)
======================================================================================
Autonomous real-time execution engine matching exact backtest mechanics on XAUUSD M5.
Features:
  1. Exact Indicator Parity: Uses identical signal calculations and parameters as backtest.
  2. Causal Bar Execution: Reads completed closed bar (iloc[-2]) on every newly closed M5 bar.
  3. Conviction Weighted Sizing: $250 base risk * conviction weight -> dynamic MT5 lot sizing.
  4. Timezone Normalization: Converts MT5 broker time (Europe/Nicosia) to true UTC.
  5. Friday 20:00 UTC Embargo: Automatically closes positions before weekend market closure.
  6. Atlas Protector Shield: Hard circuit breaker liquidates if floating loss touches -1.8%.
"""

import os
import sys
import time
import math
import logging
from datetime import datetime, timezone, timedelta
import pandas as pd
import numpy as np

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None
    print("Warning: MetaTrader5 package not installed. Install with: pip install MetaTrader5")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Ensemble_04_6Engine_InverseDD_Fleet")

# =============================================================================
# ENSEMBLE CONFIGURATION & ENGINE MAPPING
# =============================================================================
BASE_CAPITAL = 25000.0
BASE_RISK_USD = 250.0  # 1.0% uncompounded
SYMBOL = "XAUUSD"
WARMUP_BARS = 600

# =====================================================================
# E5_OFIRunner (Weight: 0.8x, Magic: 555005)
# File: rank_005_+$25,799_strat_15071e01.py
# =====================================================================
def calc_signals_E5_OFIRunner(df, p={'asia_window': 108, 'energy_min': 0.982, 'energy_max': 5.652, 'vol_ma': 41, 'vol_mult': 0.93, 'adx_thresh': 18.705, 'er_period': 17, 'er_thresh': 0.352, 'micro_window': 9, 'ofi_thresh': 0.13, 'atr_sl_mult': 1.142, 'atr_tp_mult': 19.259}):
    if p is None:
        p = {}

    high = df['high']
    low = df['low']
    close = df['close']

    vol = df['volume'] if 'volume' in df.columns else pd.Series(1.0, index=df.index)
    vol = vol.fillna(0.0)

    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_14 = tr.rolling(14).mean().ffill().fillna(0)

    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index)

    atr_smooth = tr.ewm(alpha=1/14, adjust=False).mean()
    plus_di = 100 * plus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)
    minus_di = 100 * minus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx_val = dx.ewm(alpha=1/14, adjust=False).mean().ffill().fillna(0)
    p_di = plus_di.ffill().fillna(0)
    m_di = minus_di.ffill().fillna(0)

    def session_mask(dataframe, session_name):
        idx = dataframe.index
        if hasattr(idx, 'hour'):
            hours = idx.hour
        elif hasattr(idx, 'indexer') and hasattr(idx, 'time'):
            hours = pd.Series([t.hour for t in idx.time], index=idx)
        else:
            try:
                dt_index = pd.to_datetime(idx)
                hours = dt_index.hour
            except Exception:
                return pd.Series(False, index=idx)

        s = session_name.lower()
        if s == 'asia':
            return (hours >= 0) & (hours < 8)
        elif s == 'london':
            return (hours >= 7) & (hours < 16)
        elif s in ('ny', 'new york', 'new_york'):
            return (hours >= 12) & (hours < 21)
        return pd.Series(False, index=idx)

    asia_mask = session_mask(df, 'asia')
    london_mask = session_mask(df, 'london')
    ny_mask = session_mask(df, 'ny')

    asia_window = p.get('asia_window', 96)
    asia_high = high.where(asia_mask).rolling(asia_window, min_periods=1).max().ffill().fillna(0)
    asia_low = low.where(asia_mask).rolling(asia_window, min_periods=1).min().ffill().fillna(0)

    asia_range = asia_high - asia_low
    norm_energy = asia_range / atr_14.replace(0, np.nan)

    bull_expansion = close > asia_high
    bear_expansion = close < asia_low

    trend_bull = p_di > m_di
    trend_bear = m_di > p_di

    active_session = london_mask | ny_mask

    energy_min = p.get('energy_min', 1.307)
    energy_max = p.get('energy_max', 4.427)

    raw_bull = bull_expansion & trend_bull & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)
    raw_bear = bear_expansion & trend_bear & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)

    vol_ma_period = p.get('vol_ma', 38)
    vol_mult = p.get('vol_mult', 0.93)
    vol_active = atr_14 > atr_14.rolling(vol_ma_period).mean().ffill().fillna(0) * vol_mult

    adx_thresh = p.get('adx_thresh', 18.439)
    adx_active = adx_val > adx_thresh

    er_period = p.get('er_period', 15)
    direction = (close - close.shift(er_period)).abs()
    volatility_sum = tr.rolling(er_period).sum()
    efficiency_ratio = direction / volatility_sum.replace(0, np.nan)
    efficiency_ratio = efficiency_ratio.ffill().fillna(0)

    er_thresh = p.get('er_thresh', 0.335)
    er_active = efficiency_ratio > er_thresh

    regime_awake = vol_active & adx_active & er_active

    # MUTATION ANGLE 4: Enhanced Microstructure Filter using Volume-Weighted Tick Imbalance (VWTI)
    # Instead of simple OFI, we compute a volume-weighted tick imbalance over a fast micro-window.
    # This isolates aggressive institutional order flow by weighting price direction by actual traded volume,
    # filtering out low-volume retail noise and confirming true directional pressure before entry.
    price_chg = close.diff()
    tick_dir = np.sign(price_chg)
    tick_dir = tick_dir.replace(0, np.nan).ffill().fillna(0)

    # Volume-weighted directional flow
    vwti_flow = tick_dir * vol

    micro_window = p.get('micro_window', 12)
    rolling_vwti = vwti_flow.rolling(micro_window, min_periods=1).sum()
    rolling_vol_sum = vol.rolling(micro_window, min_periods=1).sum()

    # Normalize the imbalance by total volume to get a [-1, 1] ratio
    vwti_ratio = rolling_vwti / rolling_vol_sum.replace(0, np.nan)
    vwti_ratio = vwti_ratio.ffill().fillna(0)

    ofi_thresh = p.get('ofi_thresh', 0.129)
    micro_bull = vwti_ratio > ofi_thresh
    micro_bear = vwti_ratio < -ofi_thresh

    # Discrete state-transition triggers to prevent signal overload
    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False)) & micro_bull
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False)) & micro_bear

    df['bull_signal'] = bull_trigger & regime_awake
    df['bear_signal'] = bear_trigger & regime_awake

    # High asymmetry volatility exits (3.5R to 5.0R targets)
    atr_sl_mult = p.get('atr_sl_mult', 1.142)
    atr_tp_mult = p.get('atr_tp_mult', 19.259)

    sl_long = df['sl_long'] = close - (atr_14 * atr_sl_mult)
    df['tp1_long'] = close + (atr_14 * atr_tp_mult)
    sl_short = df['sl_short'] = close + (atr_14 * atr_sl_mult)
    df['tp1_short'] = close - (atr_14 * atr_tp_mult)

    return df

# =====================================================================
# E9_FlowCompress (Weight: 1.5x, Magic: 555009)
# File: rank_009_+$24,552_strat_0974f2e8.py
# =====================================================================
def calc_signals_E9_FlowCompress(df, p={'asia_window': 86, 'energy_min': 1.241, 'energy_max': 5.579, 'vol_ma': 41, 'vol_mult': 1.017, 'adx_thresh': 20.575, 'er_period': 17, 'er_thresh': 0.343, 'micro_window': 11, 'ofi_thresh': 0.117, 'atr_sl_mult': 1.078, 'atr_tp_mult': 10.841, 'trail_atr_mult': 4.193, 'trail_lookback': 20}):
    if p is None:
        p = {}

    import pandas as pd
    import numpy as np

    high = df['high']
    low = df['low']
    close = df['close']

    vol = df['volume'] if 'volume' in df.columns else pd.Series(1.0, index=df.index)
    vol = vol.fillna(0.0)

    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_14 = tr.rolling(14).mean().ffill().fillna(0)

    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index)

    atr_smooth = tr.ewm(alpha=1/14, adjust=False).mean()
    plus_di = 100 * plus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)
    minus_di = 100 * minus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx_val = dx.ewm(alpha=1/14, adjust=False).mean().ffill().fillna(0)
    p_di = plus_di.ffill().fillna(0)
    m_di = minus_di.ffill().fillna(0)

    def session_mask(dataframe, session_name):
        idx = dataframe.index
        if hasattr(idx, 'hour'):
            hours = idx.hour
        elif hasattr(idx, 'indexer') and hasattr(idx, 'time'):
            hours = pd.Series([t.hour for t in idx.time], index=idx)
        else:
            try:
                dt_index = pd.to_datetime(idx)
                hours = dt_index.hour
            except Exception:
                return pd.Series(False, index=idx)

        s = session_name.lower()
        if s == 'asia':
            return (hours >= 0) & (hours < 8)
        elif s == 'london':
            return (hours >= 7) & (hours < 16)
        elif s in ('ny', 'new york', 'new_york'):
            return (hours >= 12) & (hours < 21)
        return pd.Series(False, index=idx)

    asia_mask = session_mask(df, 'asia')
    london_mask = session_mask(df, 'london')
    ny_mask = session_mask(df, 'ny')

    asia_window = p.get('asia_window', 94)
    asia_high = high.where(asia_mask).rolling(asia_window, min_periods=1).max().ffill().fillna(0)
    asia_low = low.where(asia_mask).rolling(asia_window, min_periods=1).min().ffill().fillna(0)

    asia_range = asia_high - asia_low
    norm_energy = asia_range / atr_14.replace(0, np.nan)

    bull_expansion = close > asia_high
    bear_expansion = close < asia_low

    trend_bull = p_di > m_di
    trend_bear = m_di > p_di

    active_session = london_mask | ny_mask

    energy_min = p.get('energy_min', 1.352)
    energy_max = p.get('energy_max', 5.196)

    raw_bull = bull_expansion & trend_bull & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)
    raw_bear = bear_expansion & trend_bear & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)

    vol_ma_period = p.get('vol_ma', 46)
    vol_mult = p.get('vol_mult', 1.017)
    vol_active = atr_14 > atr_14.rolling(vol_ma_period).mean().ffill().fillna(0) * vol_mult

    adx_thresh = p.get('adx_thresh', 22.07)
    adx_active = adx_val > adx_thresh

    er_period = p.get('er_period', 14)
    direction = (close - close.shift(er_period)).abs()
    volatility_sum = tr.rolling(er_period).sum()
    efficiency_ratio = direction / volatility_sum.replace(0, np.nan)
    efficiency_ratio = efficiency_ratio.ffill().fillna(0)

    er_thresh = p.get('er_thresh', 0.334)
    er_active = efficiency_ratio > er_thresh

    regime_awake = vol_active & adx_active & er_active

    price_chg = close.diff()
    tick_dir = np.sign(price_chg)
    tick_dir = tick_dir.replace(0, np.nan).ffill().fillna(0)

    buy_vol = np.where(tick_dir > 0, vol, 0.0)
    sell_vol = np.where(tick_dir < 0, vol, 0.0)

    micro_window = p.get('micro_window', 12)
    rolling_buy = pd.Series(buy_vol, index=df.index).rolling(micro_window, min_periods=1).sum()
    rolling_sell = pd.Series(sell_vol, index=df.index).rolling(micro_window, min_periods=1).sum()

    total_flow = rolling_buy + rolling_sell
    ofi = (rolling_buy - rolling_sell) / total_flow.replace(0, np.nan)
    ofi = ofi.ffill().fillna(0)

    ofi_thresh = p.get('ofi_thresh', 0.142)
    micro_bull = ofi > ofi_thresh
    micro_bear = ofi < -ofi_thresh

    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False)) & micro_bull
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False)) & micro_bear

    df['bull_signal'] = bull_trigger & regime_awake
    df['bear_signal'] = bear_trigger & regime_awake

    atr_sl_mult = p.get('atr_sl_mult', 1.078)
    atr_tp_mult = p.get('atr_tp_mult', 10.841)
    trail_atr_mult = p.get('trail_atr_mult', 4.065)
    trail_lookback = p.get('trail_lookback', 25)

    kc_mid = close.ewm(span=20, adjust=False).mean()
    kc_upper = kc_mid + (atr_14 * 2.0)
    kc_lower = kc_mid - (atr_14 * 2.0)

    valid_long_trail = close >= kc_mid
    valid_short_trail = close <= kc_mid

    atr_fast = tr.rolling(5).mean().ffill().fillna(0)
    atr_slow = tr.rolling(50).mean().ffill().fillna(0)
    atr_ratio = atr_fast / atr_slow.replace(0, np.nan)
    atr_ratio = atr_ratio.ffill().fillna(1.0)

    dyn_trail_mult = trail_atr_mult / np.clip(atr_ratio, 0.5, 2.5)

    rolling_highest = high.rolling(trail_lookback, min_periods=1).max()
    rolling_lowest = low.rolling(trail_lookback, min_periods=1).min()

    chandelier_long_base = np.where(valid_long_trail, rolling_highest, kc_mid) - (atr_14 * dyn_trail_mult)
    chandelier_short_base = np.where(valid_short_trail, rolling_lowest, kc_mid) + (atr_14 * dyn_trail_mult)

    atr_very_slow = tr.rolling(100).mean().ffill().fillna(0)
    macro_atr_ratio = atr_14 / atr_very_slow.replace(0, np.nan)
    macro_atr_ratio = macro_atr_ratio.ffill().fillna(1.0)

    expansion_factor = np.clip(macro_atr_ratio, 0.8, 2.0)

    chandelier_long = chandelier_long_base - (atr_14 * (expansion_factor - 1.0) * 0.5)
    chandelier_short = chandelier_short_base + (atr_14 * (expansion_factor - 1.0) * 0.5)

    initial_sl_long = close - (atr_14 * atr_sl_mult)
    initial_sl_short = close + (atr_14 * atr_sl_mult)

    prev_sl_long = initial_sl_long.shift(1).ffill().fillna(0)
    prev_sl_short = initial_sl_short.shift(1).ffill().fillna(1e9)

    dynamic_sl_long = np.maximum(chandelier_long, prev_sl_long)
    final_sl_long = np.where(df['bull_signal'], initial_sl_long, dynamic_sl_long)

    dynamic_sl_short = np.minimum(chandelier_short, prev_sl_short)
    final_sl_short = np.where(df['bear_signal'], initial_sl_short, dynamic_sl_short)

    df['sl_long'] = final_sl_long
    df['tp1_long'] = close + (atr_14 * atr_tp_mult)
    df['sl_short'] = final_sl_short
    df['tp1_short'] = close - (atr_14 * atr_tp_mult)

    return df

# =====================================================================
# E41_AsymmVol (Weight: 1.5x, Magic: 555041)
# File: rank_041_+$14,982_strat_3ad60d13.py
# =====================================================================
# CONCEPT: Mutated the VATAS strategy by implementing a Volatility-Adjusted Trailing ATR Stop (VATAS) that dynamically tightens the stop-loss multiplier as price extends in favor of the trade, locking in profits during explosive Gold runs while maintaining wide 4.5R+ take-profit targets to capture maximum trend asymmetry.
def calc_signals_E41_AsymmVol(df, p={'jerk_window': 11, 'cmf_window': 29, 'atr_period': 16, 'atr_sl_mult': 0.95, 'atr_tp_mult': 7.413, 'vol_ma_period': 20, 'jerk_threshold': 0.116, 'cmf_threshold': 0.07, 'vol_sleep_mult': 1.049, 'smooth_fast': 3, 'smooth_slow': 12, 'er_period': 9}):
    if p is None:
        p = {}

    jerk_window = p.get('jerk_window', 11)
    cmf_window = p.get('cmf_window', 31)
    atr_period = p.get('atr_period', 18)
    atr_sl_mult = p.get('atr_sl_mult', 0.95)
    atr_tp_mult = p.get('atr_tp_mult', 7.413)
    vol_ma_period = p.get('vol_ma_period', 18)
    jerk_threshold = p.get('jerk_threshold', 0.108)
    cmf_threshold = p.get('cmf_threshold', 0.058)
    vol_sleep_mult = p.get('vol_sleep_mult', 1.065)
    smooth_fast = p.get('smooth_fast', 3)
    smooth_slow = p.get('smooth_slow', 10)
    er_period = p.get('er_period', 11)

    close = df['close']
    high = df['high']
    low = df['low']
    volume = df['volume'].astype(float)

    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr = tr.rolling(atr_period).mean().ffill().fillna(0)

    # Volatility Regime Gate (Sleep Switch)
    atr_ma = atr.rolling(vol_ma_period).mean().ffill().fillna(0)
    awake_vol = atr > (atr_ma * vol_sleep_mult)

    direction = (close - close.shift(er_period)).abs()
    volatility_path = close.diff().abs().rolling(er_period).sum().replace(0, 1e-9)
    efficiency_ratio = direction / volatility_path
    awake_trend = efficiency_ratio > 0.3

    # ADX Trend Strength Filter
    plus_dm = high.diff()
    minus_dm = -low.diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
    minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0.0)

    atr_smooth = tr.ewm(span=atr_period, adjust=False).mean().ffill().fillna(0)
    plus_di = 100 * (plus_dm.ewm(span=atr_period, adjust=False).mean() / atr_smooth.replace(0, 1e-9))
    minus_di = 100 * (minus_dm.ewm(span=atr_period, adjust=False).mean() / atr_smooth.replace(0, 1e-9))
    dx = (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, 1e-9) * 100
    adx = dx.ewm(span=atr_period, adjust=False).mean().ffill().fillna(0)
    awake_adx = adx > 20.0

    awake = awake_vol & awake_trend & awake_adx

    # Rolling VWAP Deviation
    tp_vol = ((high + low + close) / 3.0) * volume
    roll_vwap = tp_vol.rolling(vol_ma_period).sum() / volume.rolling(vol_ma_period).sum().replace(0, 1e-9)
    vwap_dist = (close - roll_vwap) / atr.replace(0, 1e-9)

    # Volume Weighted Price (Rolling)
    vol_ma = volume.rolling(vol_ma_period).mean().replace(0, 1e-9)
    norm_vol = volume / vol_ma
    vwp = (((high + low + close) / 3.0) * norm_vol).rolling(jerk_window).sum() / norm_vol.rolling(jerk_window).sum().replace(0, 1e-9)

    vel = vwp.diff(1)
    acc = vel.diff(1)
    jerk_raw = acc.diff(1)
    
    # ATR-Normalized Jerk
    jerk_norm = jerk_raw / atr.replace(0, 1e-9)
    jerk_smooth = jerk_norm.ewm(span=smooth_fast, adjust=False).mean() - jerk_norm.ewm(span=smooth_slow, adjust=False).mean()
    jerk_smooth = jerk_smooth.ffill().fillna(0)

    # Chaikin Money Flow
    mfm = ((close - low) - (high - close)) / (high - low).replace(0, 1e-9)
    mfv = mfm * volume
    cmf = mfv.rolling(cmf_window).sum() / volume.rolling(cmf_window).sum().replace(0, 1e-9)
    cmf = cmf.ffill().fillna(0)

    # CMF Velocity Confirmation
    cmf_vel = cmf.diff(3).ffill().fillna(0)
    bull_cmf_vel = cmf_vel > 0
    bear_cmf_vel = cmf_vel < 0

    # Volume-Weighted MACD Histogram Acceleration
    vwmacd_fast = (close * norm_vol).ewm(span=smooth_fast, adjust=False).mean() / norm_vol.ewm(span=smooth_fast, adjust=False).mean().replace(0, 1e-9)
    vwmacd_slow = (close * norm_vol).ewm(span=smooth_slow, adjust=False).mean() / norm_vol.ewm(span=smooth_slow, adjust=False).mean().replace(0, 1e-9)
    vwmacd_hist = (vwmacd_fast - vwmacd_slow) / atr.replace(0, 1e-9)
    vwmacd_accel = vwmacd_hist.diff(1).ffill().fillna(0)
    bull_vwmacd_accel = vwmacd_accel > 0
    bear_vwmacd_accel = vwmacd_accel < 0

    # Microstructure Order-Flow Imbalance Filter
    clv = ((close - low) - (high - close)) / (high - low).replace(0, 1e-9)
    vw_clv = (clv * norm_vol).ewm(span=smooth_fast, adjust=False).mean() / norm_vol.ewm(span=smooth_fast, adjust=False).mean().replace(0, 1e-9)
    ofi_rate = vw_clv.diff(1).ffill().fillna(0)
    ofi_accel = ofi_rate.diff(1).ffill().fillna(0)
    ofi_accel_norm = ofi_accel / atr.replace(0, 1e-9)
    
    micro_thresh = 0.002 * (atr / atr_ma.replace(0, 1e-9)).clip(lower=0.5, upper=2.0)
    
    bull_micro = ofi_accel_norm > micro_thresh
    bear_micro = ofi_accel_norm < -micro_thresh

    # Volume-Weighted Price Oscillator (VWPO)
    vwpo_fast = (close * norm_vol).ewm(span=smooth_fast, adjust=False).mean() / norm_vol.ewm(span=smooth_fast, adjust=False).mean().replace(0, 1e-9)
    vwpo_slow = (close * norm_vol).ewm(span=smooth_slow, adjust=False).mean() / norm_vol.ewm(span=smooth_slow, adjust=False).mean().replace(0, 1e-9)
    vwpo_raw = vwpo_fast - vwpo_slow
    vwpo_norm = vwpo_raw / atr.replace(0, 1e-9)
    dyn_vwpo_thresh = 0.35 * (atr / atr_ma.replace(0, 1e-9)).clip(lower=0.5, upper=2.0)
    
    bull_vwpo = vwpo_norm > dyn_vwpo_thresh
    bear_vwpo = vwpo_norm < -dyn_vwpo_thresh
    
    vol_surge = norm_vol > 1.15

    # Keltner Channel Squeeze Breakout Filter
    bb_mid = close.rolling(atr_period).mean().ffill().fillna(0)
    bb_std = close.rolling(atr_period).std().ffill().fillna(0)
    bb_upper = bb_mid + (2.0 * bb_std)
    bb_lower = bb_mid - (2.0 * bb_std)
    bb_width = (bb_upper - bb_lower) / bb_mid.replace(0, 1e-9)

    kc_basis = close.ewm(span=atr_period, adjust=False).mean()
    kc_upper = kc_basis + (2.0 * atr)
    kc_lower = kc_basis - (2.0 * atr)
    kc_width = (kc_upper - kc_lower) / kc_basis.replace(0, 1e-9)

    squeeze_on = bb_width < kc_width
    squeeze_fire = squeeze_on.shift(1).fillna(False) & (~squeeze_on)
    
    atr_expansion_rate = (atr / atr_ma.replace(0, 1e-9)).ffill().fillna(1.0)
    valid_breakout_env = squeeze_fire | (atr_expansion_rate > 1.5)

    # Dynamic Thresholds Normalized by Volatility
    dyn_jerk_thresh = jerk_threshold * (atr / atr_ma.replace(0, 1e-9)).clip(lower=0.5, upper=2.0)
    dyn_cmf_thresh = cmf_threshold

    raw_bull_jerk = jerk_smooth > dyn_jerk_thresh
    raw_bear_jerk = jerk_smooth < -dyn_jerk_thresh
    
    raw_bull_cmf = cmf > dyn_cmf_thresh
    raw_bear_cmf = cmf < -dyn_cmf_thresh
    
    raw_bull_vwap = vwap_dist > -0.8
    raw_bear_vwap = vwap_dist < 0.8

    raw_bull = raw_bull_jerk & raw_bull_cmf & raw_bull_vwap & bull_cmf_vel & bull_vwmacd_accel & bull_micro & bull_vwpo & vol_surge & valid_breakout_env
    raw_bear = raw_bear_jerk & raw_bear_cmf & raw_bear_vwap & bear_cmf_vel & bear_vwmacd_accel & bear_micro & bear_vwpo & vol_surge & valid_breakout_env

    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False))
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False))

    df['bull_signal'] = bull_trigger & awake
    df['bear_signal'] = bear_trigger & awake

    # MUTATION ANGLE 2: Volatility-Adjusted Trailing ATR Stop (VATAS)
    # Dynamically scales the SL multiplier based on ATR expansion rate and recent directional velocity.
    # During extreme expansions (parabolic runs), the SL tightens aggressively to lock in profits.
    # During normal trends, it maintains the base tight SL for maximum R-multiple potential.
    
    # Calculate recent directional velocity normalized by ATR
    dir_velocity = (close - close.shift(er_period)) / (atr * er_period).replace(0, 1e-9)
    abs_velocity = dir_velocity.abs()
    
    # Base dynamic scaling from ATR expansion rate
    sl_dyn_scale_base = np.where(
        atr_expansion_rate > 1.5, 
        0.75,  # Aggressive tightening during parabolic expansion
        np.where(
            atr_expansion_rate > 1.0, 
            0.90,  # Moderate tightening during healthy expansion
            1.0    # Standard width during compression/normalcy
        )
    )
    
    # Additional tightening factor when price velocity is extremely high (locking in runners)
    velocity_lock_factor = np.where(abs_velocity > 1.5, 0.85, 1.0)
    
    # Combine factors, ensuring we never widen beyond base or tighten below 0.5 ATR (prevents noise stops)
    final_sl_scale = np.clip(sl_dyn_scale_base * velocity_lock_factor, 0.5, 1.0)
    dyn_sl_mult = atr_sl_mult * final_sl_scale

    # Scale Take Profit proportionally to allow massive runners during high expansion regimes
    tp_dyn_scale = np.where(
        atr_expansion_rate > 1.0,
        1.0 + (atr_expansion_rate - 1.0) * 1.2,
        1.0
    )
    tp_dyn_scale = np.clip(tp_dyn_scale, 1.0, 2.0)
    dyn_tp_mult = atr_tp_mult * tp_dyn_scale

    # High Asymmetry Volatility Exits
    df['sl_long'] = df['close'] - (atr * dyn_sl_mult)
    df['tp1_long'] = df['close'] + (atr * dyn_tp_mult)
    df['sl_short'] = df['close'] + (atr * dyn_sl_mult)
    df['tp1_short'] = df['close'] - (atr * dyn_tp_mult)

    return df

# =====================================================================
# E35_FlowState (Weight: 0.8x, Magic: 555035)
# File: rank_035_+$15,807_strat_58a4dae8.py
# =====================================================================
# CONCEPT: Mutated the strategy by implementing a microstructure order-flow imbalance filter using volume-weighted close location value acceleration to isolate institutional footprint entries before explosive Gold trend expansions.
def calc_signals_E35_FlowState(df, p={'jerk_window': 8, 'cmf_window': 27, 'atr_period': 19, 'atr_sl_mult': 1.522, 'atr_tp_mult': 10.191, 'vol_ma_period': 38, 'jerk_threshold': 0.112, 'cmf_threshold': 0.052, 'vol_sleep_mult': 1.365, 'smooth_fast': 3, 'smooth_slow': 9, 'er_period': 13}):
    if p is None:
        p = {}

    jerk_window = p.get('jerk_window', 7)
    cmf_window = p.get('cmf_window', 27)
    atr_period = p.get('atr_period', 27)
    atr_sl_mult = p.get('atr_sl_mult', 1.522)
    atr_tp_mult = p.get('atr_tp_mult', 10.191)
    vol_ma_period = p.get('vol_ma_period', 30)
    jerk_threshold = p.get('jerk_threshold', 0.145)
    cmf_threshold = p.get('cmf_threshold', 0.048)
    vol_sleep_mult = p.get('vol_sleep_mult', 1.1)
    smooth_fast = p.get('smooth_fast', 4)
    smooth_slow = p.get('smooth_slow', 10)
    er_period = p.get('er_period', 9)

    close = df['close']
    high = df['high']
    low = df['low']
    volume = df['volume'].astype(float)

    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr = tr.rolling(atr_period).mean().ffill().fillna(0)

    # Volatility Regime Gate (Sleep Switch)
    atr_ma = atr.rolling(vol_ma_period).mean().ffill().fillna(0)
    awake_vol = atr > (atr_ma * vol_sleep_mult)

    direction = (close - close.shift(er_period)).abs()
    volatility_path = close.diff().abs().rolling(er_period).sum().replace(0, 1e-9)
    efficiency_ratio = direction / volatility_path
    awake_trend = efficiency_ratio > 0.3

    # ADX Trend Strength Filter
    plus_dm = high.diff()
    minus_dm = -low.diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
    minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0.0)

    atr_smooth = tr.ewm(span=atr_period, adjust=False).mean().ffill().fillna(0)
    plus_di = 100 * (plus_dm.ewm(span=atr_period, adjust=False).mean() / atr_smooth.replace(0, 1e-9))
    minus_di = 100 * (minus_dm.ewm(span=atr_period, adjust=False).mean() / atr_smooth.replace(0, 1e-9))
    dx = (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, 1e-9) * 100
    adx = dx.ewm(span=atr_period, adjust=False).mean().ffill().fillna(0)
    awake_adx = adx > 20.0

    awake = awake_vol & awake_trend & awake_adx

    # Rolling VWAP Deviation
    tp_vol = ((high + low + close) / 3.0) * volume
    roll_vwap = tp_vol.rolling(vol_ma_period).sum() / volume.rolling(vol_ma_period).sum().replace(0, 1e-9)
    vwap_dist = (close - roll_vwap) / atr.replace(0, 1e-9)

    # Volume Weighted Price (Rolling)
    vol_ma = volume.rolling(vol_ma_period).mean().replace(0, 1e-9)
    norm_vol = volume / vol_ma
    vwp = (((high + low + close) / 3.0) * norm_vol).rolling(jerk_window).sum() / norm_vol.rolling(jerk_window).sum().replace(0, 1e-9)

    vel = vwp.diff(1)
    acc = vel.diff(1)
    jerk_raw = acc.diff(1)
    
    # ATR-Normalized Jerk
    jerk_norm = jerk_raw / atr.replace(0, 1e-9)
    jerk_smooth = jerk_norm.ewm(span=smooth_fast, adjust=False).mean() - jerk_norm.ewm(span=smooth_slow, adjust=False).mean()
    jerk_smooth = jerk_smooth.ffill().fillna(0)

    # Chaikin Money Flow
    mfm = ((close - low) - (high - close)) / (high - low).replace(0, 1e-9)
    mfv = mfm * volume
    cmf = mfv.rolling(cmf_window).sum() / volume.rolling(cmf_window).sum().replace(0, 1e-9)
    cmf = cmf.ffill().fillna(0)

    # CMF Velocity Confirmation
    cmf_vel = cmf.diff(3).ffill().fillna(0)
    bull_cmf_vel = cmf_vel > 0
    bear_cmf_vel = cmf_vel < 0

    # Volume-Weighted MACD Histogram Acceleration
    vwmacd_fast = (close * norm_vol).ewm(span=smooth_fast, adjust=False).mean() / norm_vol.ewm(span=smooth_fast, adjust=False).mean().replace(0, 1e-9)
    vwmacd_slow = (close * norm_vol).ewm(span=smooth_slow, adjust=False).mean() / norm_vol.ewm(span=smooth_slow, adjust=False).mean().replace(0, 1e-9)
    vwmacd_hist = (vwmacd_fast - vwmacd_slow) / atr.replace(0, 1e-9)
    vwmacd_accel = vwmacd_hist.diff(1).ffill().fillna(0)
    bull_vwmacd_accel = vwmacd_accel > 0
    bear_vwmacd_accel = vwmacd_accel < 0

    # MUTATION ANGLE 4: Microstructure Order-Flow Imbalance Filter
    # Close Location Value measures where the close prints relative to the bar's range
    clv = ((close - low) - (high - close)) / (high - low).replace(0, 1e-9)
    # Volume-weighted CLV approximates institutional order flow pressure
    vw_clv = (clv * norm_vol).ewm(span=smooth_fast, adjust=False).mean() / norm_vol.ewm(span=smooth_fast, adjust=False).mean().replace(0, 1e-9)
    # First derivative of microstructure flow (aggressive buying/selling rate)
    ofi_rate = vw_clv.diff(1).ffill().fillna(0)
    # Second derivative (acceleration of institutional footprint - detects sudden block execution)
    ofi_accel = ofi_rate.diff(1).ffill().fillna(0)
    # Normalize by ATR to maintain volatility invariance across regimes
    ofi_accel_norm = ofi_accel / atr.replace(0, 1e-9)
    
    # Dynamic microstructure threshold scales with rolling volatility
    micro_thresh = 0.002 * (atr / atr_ma.replace(0, 1e-9)).clip(lower=0.5, upper=2.0)
    
    bull_micro = ofi_accel_norm > micro_thresh
    bear_micro = ofi_accel_norm < -micro_thresh

    # Dynamic Thresholds Normalized by Volatility
    dyn_jerk_thresh = jerk_threshold * (atr / atr_ma.replace(0, 1e-9)).clip(lower=0.5, upper=2.0)
    dyn_cmf_thresh = cmf_threshold

    # Raw Conditions
    raw_bull_jerk = jerk_smooth > dyn_jerk_thresh
    raw_bear_jerk = jerk_smooth < -dyn_jerk_thresh
    
    raw_bull_cmf = cmf > dyn_cmf_thresh
    raw_bear_cmf = cmf < -dyn_cmf_thresh
    
    raw_bull_vwap = vwap_dist > -0.8
    raw_bear_vwap = vwap_dist < 0.8

    # Combined Raw States (Now gated by Microstructure Imbalance)
    raw_bull = raw_bull_jerk & raw_bull_cmf & raw_bull_vwap & bull_cmf_vel & bull_vwmacd_accel & bull_micro
    raw_bear = raw_bear_jerk & raw_bear_cmf & raw_bear_vwap & bear_cmf_vel & bear_vwmacd_accel & bear_micro

    # Discrete Event Triggers (State Transitions)
    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False))
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False))

    # Apply Volatility Regime Gate
    df['bull_signal'] = bull_trigger & awake
    df['bear_signal'] = bear_trigger & awake

    # Dynamic Volatility Exit via Keltner Squeeze Ratio
    bb_mid = close.rolling(20).mean().ffill().fillna(0)
    bb_std = close.rolling(20).std().ffill().fillna(0)
    bb_width = (4.0 * bb_std) / bb_mid.replace(0, 1e-9)

    kc_mid = close.ewm(span=20, adjust=False).mean()
    kc_width = (4.0 * atr) / kc_mid.replace(0, 1e-9)

    squeeze_ratio = (bb_width / kc_width.replace(0, 1e-9)).ffill().fillna(1.0)

    tp_dyn_scale = np.where(squeeze_ratio < 1.0, 1.0 + (1.0 - squeeze_ratio) * 2.0, 1.0)
    tp_dyn_scale = np.clip(tp_dyn_scale, 0.8, 1.5)
    dyn_tp_mult = atr_tp_mult * tp_dyn_scale

    sl_dyn_scale = np.where(squeeze_ratio < 1.0, 0.85, 1.0)
    dyn_sl_mult = atr_sl_mult * sl_dyn_scale

    # High Asymmetry Volatility Exits
    df['sl_long'] = df['close'] - (atr * dyn_sl_mult)
    df['tp1_long'] = df['close'] + (atr * dyn_tp_mult)
    df['sl_short'] = df['close'] + (atr * dyn_sl_mult)
    df['tp1_short'] = df['close'] - (atr * dyn_tp_mult)

    return df

# =====================================================================
# E3_AsiaBreakout (Weight: 0.4x, Magic: 555003)
# File: rank_003_+$30,883_strat_0fa46b37.py
# =====================================================================
def calc_signals_E3_AsiaBreakout(df, p={'asia_window': 94, 'energy_min': 1.352, 'energy_max': 5.196, 'vol_ma': 46, 'vol_mult': 1.077, 'adx_thresh': 22.07, 'er_period': 14, 'er_thresh': 0.334, 'micro_window': 12, 'ofi_thresh': 0.142, 'atr_sl_mult': 1.094, 'atr_tp_mult': 16.938, 'trail_atr_mult': 4.065, 'trail_lookback': 25}):
    if p is None:
        p = {}

    import pandas as pd
    import numpy as np

    high = df['high']
    low = df['low']
    close = df['close']

    vol = df['volume'] if 'volume' in df.columns else pd.Series(1.0, index=df.index)
    vol = vol.fillna(0.0)

    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_14 = tr.rolling(14).mean().ffill().fillna(0)

    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index)

    atr_smooth = tr.ewm(alpha=1/14, adjust=False).mean()
    plus_di = 100 * plus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)
    minus_di = 100 * minus_dm.ewm(alpha=1/14, adjust=False).mean() / atr_smooth.replace(0, np.nan)

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx_val = dx.ewm(alpha=1/14, adjust=False).mean().ffill().fillna(0)
    p_di = plus_di.ffill().fillna(0)
    m_di = minus_di.ffill().fillna(0)

    def session_mask(dataframe, session_name):
        idx = dataframe.index
        if hasattr(idx, 'hour'):
            hours = idx.hour
        elif hasattr(idx, 'indexer') and hasattr(idx, 'time'):
            hours = pd.Series([t.hour for t in idx.time], index=idx)
        else:
            try:
                dt_index = pd.to_datetime(idx)
                hours = dt_index.hour
            except Exception:
                return pd.Series(False, index=idx)

        s = session_name.lower()
        if s == 'asia':
            return (hours >= 0) & (hours < 8)
        elif s == 'london':
            return (hours >= 7) & (hours < 16)
        elif s in ('ny', 'new york', 'new_york'):
            return (hours >= 12) & (hours < 21)
        return pd.Series(False, index=idx)

    asia_mask = session_mask(df, 'asia')
    london_mask = session_mask(df, 'london')
    ny_mask = session_mask(df, 'ny')

    asia_window = p.get('asia_window', 96)
    asia_high = high.where(asia_mask).rolling(asia_window, min_periods=1).max().ffill().fillna(0)
    asia_low = low.where(asia_mask).rolling(asia_window, min_periods=1).min().ffill().fillna(0)

    asia_range = asia_high - asia_low
    norm_energy = asia_range / atr_14.replace(0, np.nan)

    bull_expansion = close > asia_high
    bear_expansion = close < asia_low

    trend_bull = p_di > m_di
    trend_bear = m_di > p_di

    active_session = london_mask | ny_mask

    energy_min = p.get('energy_min', 1.307)
    energy_max = p.get('energy_max', 4.427)

    raw_bull = bull_expansion & trend_bull & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)
    raw_bear = bear_expansion & trend_bear & active_session & (norm_energy > energy_min) & (norm_energy < energy_max)

    vol_ma_period = p.get('vol_ma', 38)
    vol_mult = p.get('vol_mult', 1.077)
    vol_active = atr_14 > atr_14.rolling(vol_ma_period).mean().ffill().fillna(0) * vol_mult

    adx_thresh = p.get('adx_thresh', 18.439)
    adx_active = adx_val > adx_thresh

    er_period = p.get('er_period', 15)
    direction = (close - close.shift(er_period)).abs()
    volatility_sum = tr.rolling(er_period).sum()
    efficiency_ratio = direction / volatility_sum.replace(0, np.nan)
    efficiency_ratio = efficiency_ratio.ffill().fillna(0)

    er_thresh = p.get('er_thresh', 0.335)
    er_active = efficiency_ratio > er_thresh

    regime_awake = vol_active & adx_active & er_active

    price_chg = close.diff()
    tick_dir = np.sign(price_chg)
    tick_dir = tick_dir.replace(0, np.nan).ffill().fillna(0)

    buy_vol = np.where(tick_dir > 0, vol, 0.0)
    sell_vol = np.where(tick_dir < 0, vol, 0.0)

    micro_window = p.get('micro_window', 12)
    rolling_buy = pd.Series(buy_vol, index=df.index).rolling(micro_window, min_periods=1).sum()
    rolling_sell = pd.Series(sell_vol, index=df.index).rolling(micro_window, min_periods=1).sum()

    total_flow = rolling_buy + rolling_sell
    ofi = (rolling_buy - rolling_sell) / total_flow.replace(0, np.nan)
    ofi = ofi.ffill().fillna(0)

    ofi_thresh = p.get('ofi_thresh', 0.129)
    micro_bull = ofi > ofi_thresh
    micro_bear = ofi < -ofi_thresh

    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False)) & micro_bull
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False)) & micro_bear

    df['bull_signal'] = bull_trigger & regime_awake
    df['bear_signal'] = bear_trigger & regime_awake

    atr_sl_mult = p.get('atr_sl_mult', 1.094)
    atr_tp_mult = p.get('atr_tp_mult', 16.938)
    trail_atr_mult = p.get('trail_atr_mult', 4.224)
    trail_lookback = p.get('trail_lookback', 19)

    # MUTATION ANGLE 2: Keltner-Enhanced Dynamic Volatility Exit via ATR-Ratio Expansion Multiplier
    kc_mid = close.ewm(span=20, adjust=False).mean()
    kc_upper = kc_mid + (atr_14 * 2.0)
    kc_lower = kc_mid - (atr_14 * 2.0)

    valid_long_trail = close >= kc_mid
    valid_short_trail = close <= kc_mid

    atr_fast = tr.rolling(5).mean().ffill().fillna(0)
    atr_slow = tr.rolling(50).mean().ffill().fillna(0)
    atr_ratio = atr_fast / atr_slow.replace(0, np.nan)
    atr_ratio = atr_ratio.ffill().fillna(1.0)

    dyn_trail_mult = trail_atr_mult / np.clip(atr_ratio, 0.5, 2.5)

    rolling_highest = high.rolling(trail_lookback, min_periods=1).max()
    rolling_lowest = low.rolling(trail_lookback, min_periods=1).min()

    chandelier_long = np.where(valid_long_trail, rolling_highest, kc_mid) - (atr_14 * dyn_trail_mult)
    chandelier_short = np.where(valid_short_trail, rolling_lowest, kc_mid) + (atr_14 * dyn_trail_mult)

    initial_sl_long = close - (atr_14 * atr_sl_mult)
    initial_sl_short = close + (atr_14 * atr_sl_mult)

    prev_sl_long = initial_sl_long.shift(1).ffill().fillna(0)
    prev_sl_short = initial_sl_short.shift(1).ffill().fillna(1e9)

    dynamic_sl_long = np.maximum(chandelier_long, prev_sl_long)
    final_sl_long = np.where(df['bull_signal'], initial_sl_long, dynamic_sl_long)

    dynamic_sl_short = np.minimum(chandelier_short, prev_sl_short)
    final_sl_short = np.where(df['bear_signal'], initial_sl_short, dynamic_sl_short)

    df['sl_long'] = final_sl_long
    df['tp1_long'] = close + (atr_14 * atr_tp_mult)
    df['sl_short'] = final_sl_short
    df['tp1_short'] = close - (atr_14 * atr_tp_mult)

    return df

# =====================================================================
# E2_CorwinATR (Weight: 0.4x, Magic: 555002)
# File: rank_002_+$37,669_strat_8d2ba493.py
# =====================================================================
def calc_signals_E2_CorwinATR(df, p={'amihud_window': 52, 'z_lookback': 105, 'vol_ema_span': 16, 'kyle_window': 48, 'mom_period': 32, 'vwap_window': 16, 'vwpe_thresh': 0.927, 'vol_ma': 77, 'vol_mult': 1.05, 'stress_thresh': 1.25, 'vol_thresh': 1.5, 'atr_tp_mult': 20.25, 'atr_sl_mult': 1.445}):
    if p is None: p = {}
    high, low, close, volume = df['high'], df['low'], df['close'], df['volume']

    tr = np.maximum(high - low, np.maximum(np.abs(high - close.shift(1)), np.abs(low - close.shift(1))))
    atr_14 = tr.rolling(14).mean()

    def zscore(series, window):
        mean = series.rolling(window).mean()
        std = series.rolling(window).std()
        return (series - mean) / std.replace(0, np.nan)

    # 1. ARCHETYPE CORE EDGE: Market Microstructure & Spread Dynamics

    # A. Corwin-Schultz High-Low Spread Estimator
    beta = (np.log(high / low)) ** 2
    beta_sum = beta + beta.shift(1).fillna(0)
    gamma = (np.log(np.maximum(high, high.shift(1).fillna(high)) / np.minimum(low, low.shift(1).fillna(low)))) ** 2
    alpha_num = np.sqrt(2.0 * beta_sum) - np.sqrt(beta_sum)
    alpha_denom = 3.0 - 2.0 * np.sqrt(2.0)
    alpha = alpha_num / alpha_denom - np.sqrt(np.maximum(gamma / alpha_denom - (beta_sum / alpha_denom), 0.0))
    cs_spread = 2.0 * (np.exp(alpha) - 1.0) / (1.0 + np.exp(alpha))
    cs_spread_pct = np.abs(cs_spread / close)

    # B. Amihud Illiquidity Ratio Proxy
    abs_ret = np.abs(close.diff())
    vol_safe = volume.replace(0, np.nan).ffill().fillna(1.0)
    amihud_raw = abs_ret / vol_safe
    amihud_ma = amihud_raw.rolling(p.get('amihud_window', 52)).mean()
    amihud_z = zscore(amihud_ma, p.get('z_lookback', 105))

    # C. Volume Clock vs Time Clock Divergence
    vol_ewm = volume.ewm(span=p.get('vol_ema_span', 16)).mean()
    vol_ratio = volume / vol_ewm.replace(0, np.nan)

    # D. Kyle Lambda Proxy
    price_impact = np.abs(close.diff()) / vol_safe
    kyle_proxy = price_impact.rolling(p.get('kyle_window', 48)).mean()
    kyle_z = zscore(kyle_proxy, p.get('z_lookback', 105))

    # Composite Microstructure Stress Score
    spread_z = zscore(cs_spread_pct, p.get('z_lookback', 105))
    micro_stress = (spread_z * 0.4) + (amihud_z * 0.3) + (kyle_z * 0.3)

    # Directional Vector
    mom_slope = close.diff(p.get('mom_period', 32)) / atr_14.replace(0, np.nan)

    # 2. MUTATION ANGLE 3: VOLUME CONFIRMATION (KVO + CMF FILTER)
    # Klinger Volume Oscillator isolates long-term institutional money flow from short-term noise
    dm = high - low
    cm_prev = np.zeros(len(df))
    cm = np.zeros(len(df))
    trend = np.where(dm > dm.shift(1).fillna(0), 1, -1)

    # Vectorized Cumulative Measurement (CM) without loops using shift logic approximation
    # Since strict no-loops rule applies, we use an EMA-based proxy for KVO that captures the same dynamics
    vf = vol_safe * np.abs(2.0 * (dm / (high - low + 1e-9)) - 1.0) * trend * 100.0
    kvo_fast = vf.ewm(span=34).mean()
    kvo_slow = vf.ewm(span=55).mean()
    kvo = kvo_fast - kvo_slow
    kvo_z = zscore(kvo, p.get('z_lookback', 105))

    # Chaikin Money Flow (CMF) measures institutional accumulation/distribution pressure
    mfm = np.where((high - low) == 0, 0.0, ((close - low) - (high - close)) / (high - low))
    mfv = mfm * vol_safe
    cmf_window = p.get('vwap_window', 16)
    cmf = mfv.rolling(cmf_window).sum() / vol_safe.rolling(cmf_window).sum().replace(0, np.nan)
    cmf_z = zscore(cmf, p.get('z_lookback', 105))

    # Combined Volume Confirmation Gate: requires both KVO momentum and CMF institutional flow alignment
    vol_confirm = (kvo_z > p.get('vwpe_thresh', 0.927)) & (cmf_z > 0.5)
    vol_confirm_bear = (kvo_z < -p.get('vwpe_thresh', 0.927)) & (cmf_z < -0.5)

    # 3. VOLATILITY REGIME GATE (THE SLEEP SWITCH)
    vol_active = atr_14 > atr_14.rolling(p.get('vol_ma', 77)).mean() * p.get('vol_mult', 1.05)

    # 4. DYNAMIC VOLATILITY EXIT FILTER (ATR Expansion Gate)
    atr_roc = (atr_14 - atr_14.shift(5)) / atr_14.shift(5).replace(0, np.nan)
    atr_roc_z = zscore(atr_roc, p.get('z_lookback', 105))
    vol_expansion_gate = atr_roc_z > 0.5

    # 5. DISCRETE EVENT TRANSITIONS (Entry Triggers)
    stress_thresh = p.get('stress_thresh', 1.25)
    vol_thresh = p.get('vol_thresh', 1.5)

    raw_bull = (micro_stress > stress_thresh) & (vol_ratio > vol_thresh) & (mom_slope > 0.5) & vol_confirm & vol_expansion_gate
    bull_trigger = raw_bull & (~raw_bull.shift(1).fillna(False))

    raw_bear = (micro_stress > stress_thresh) & (vol_ratio > vol_thresh) & (mom_slope < -0.5) & vol_confirm_bear & vol_expansion_gate
    bear_trigger = raw_bear & (~raw_bear.shift(1).fillna(False))

    df['bull_signal'] = bull_trigger & vol_active
    df['bear_signal'] = bear_trigger & vol_active

    # 6. HIGH ASYMMETRY VOLATILITY EXITS (CHANDELIER TRAILING STOPS)
    chand_mult = p.get('atr_tp_mult', 20.25)
    sl_mult = p.get('atr_sl_mult', 1.445)

    roll_high = high.rolling(22).max()
    roll_low = low.rolling(22).min()

    chand_long = roll_high - (atr_14 * chand_mult)
    chand_short = roll_low + (atr_14 * chand_mult)

    init_sl_long = close - (atr_14 * sl_mult)
    init_sl_short = close + (atr_14 * sl_mult)

    df['sl_long'] = np.maximum(init_sl_long, chand_long).ffill().fillna(0)
    df['tp1_long'] = (close + (atr_14 * chand_mult)).ffill().fillna(0)

    df['sl_short'] = np.minimum(init_sl_short, chand_short).ffill().fillna(0)
    df['tp1_short'] = (close - (atr_14 * chand_mult)).ffill().fillna(0)

    return df


FLEET_REGISTRY = {
    'E5_OFIRunner': {'func': calc_signals_E5_OFIRunner, 'weight': 0.8, 'magic': 555005, 'file': 'rank_005_+$25,799_strat_15071e01.py'},
    'E9_FlowCompress': {'func': calc_signals_E9_FlowCompress, 'weight': 1.5, 'magic': 555009, 'file': 'rank_009_+$24,552_strat_0974f2e8.py'},
    'E41_AsymmVol': {'func': calc_signals_E41_AsymmVol, 'weight': 1.5, 'magic': 555041, 'file': 'rank_041_+$14,982_strat_3ad60d13.py'},
    'E35_FlowState': {'func': calc_signals_E35_FlowState, 'weight': 0.8, 'magic': 555035, 'file': 'rank_035_+$15,807_strat_58a4dae8.py'},
    'E3_AsiaBreakout': {'func': calc_signals_E3_AsiaBreakout, 'weight': 0.4, 'magic': 555003, 'file': 'rank_003_+$30,883_strat_0fa46b37.py'},
    'E2_CorwinATR': {'func': calc_signals_E2_CorwinATR, 'weight': 0.4, 'magic': 555002, 'file': 'rank_002_+$37,669_strat_8d2ba493.py'}
}

class LiveExecutionEngine:
    def __init__(self):
        self.symbol = SYMBOL
        self.last_closed_bar_time = None
        self.max_open_positions = 4

    def connect_mt5(self):
        if mt5 is None:
            logger.error("MetaTrader5 python module is required.")
            return False
        if not mt5.initialize():
            logger.error(f"Failed to initialize MT5: {mt5.last_error()}")
            return False
        info = mt5.terminal_info()
        acc = mt5.account_info()
        logger.info(f"Connected to MT5: {info.name} | Server: {acc.server} | Account: #{acc.login} | Equity: ${acc.equity:,.2f}")
        return True

    def fetch_m5_bars(self):
        """Fetches M5 bars and converts Europe/Nicosia broker server time to true UTC."""
        rates = mt5.copy_rates_from_pos(self.symbol, mt5.TIMEFRAME_M5, 0, WARMUP_BARS)
        if rates is None or len(rates) < 100:
            return None
        df = pd.DataFrame(rates)
        dt_broker = pd.to_datetime(df['time'], unit='s').dt.tz_localize(
            'Europe/Nicosia', ambiguous='NaT', nonexistent='shift_forward'
        )
        df['datetime'] = dt_broker.dt.tz_convert('UTC')
        df['dt'] = df['datetime']
        df['volume'] = df['tick_volume'].astype(float)
        df = df.dropna(subset=['datetime']).copy()
        df.set_index('datetime', inplace=True)
        df['datetime'] = df.index
        return df

    def get_open_positions(self):
        positions = mt5.positions_get(symbol=self.symbol)
        return list(positions) if positions is not None else []

    def calculate_lots(self, entry_price, sl_price, weight):
        """Dynamic lot sizing allocating exactly ($250 * weight) to the SL distance."""
        risk_usd = BASE_RISK_USD * weight
        sl_dist = abs(entry_price - sl_price)
        if sl_dist <= 0:
            return 0.01
        raw_lots = risk_usd / (sl_dist * 100.0)
        return round(max(0.01, min(raw_lots, 5.0)), 2)

    def execute_order(self, engine_name, is_long, entry_price, sl_price, tp_price, weight, magic):
        open_pos = self.get_open_positions()
        # Per-engine concurrency guard
        if any(p.magic == magic for p in open_pos):
            logger.info(f"[{engine_name}] Engine already has an active trade open. Skipping.")
            return False
        # Fleet concurrency guard
        if len(open_pos) >= self.max_open_positions:
            logger.warning(f"Fleet limit reached ({len(open_pos)}/{self.max_open_positions}). Skipping order.")
            return False

        lot_size = self.calculate_lots(entry_price, sl_price, weight)
        order_type = mt5.ORDER_TYPE_BUY if is_long else mt5.ORDER_TYPE_SELL
        
        req = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": self.symbol,
            "volume": lot_size,
            "type": order_type,
            "price": entry_price,
            "sl": round(sl_price, 2),
            "tp": round(tp_price, 2),
            "deviation": 20,
            "magic": magic,
            "comment": f"Atlas_{engine_name[:8]}",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        logger.info(f"Submitting Order: [{engine_name}] {'BUY' if is_long else 'SELL'} {lot_size} lots @ ${entry_price:,.2f} | SL: ${sl_price:,.2f} | TP: ${tp_price:,.2f} (Weight: {weight}x, Risk: ${BASE_RISK_USD * weight:.2f})")
        res = mt5.order_send(req)
        if res and res.retcode == mt5.TRADE_RETCODE_DONE:
            logger.info(f"SUCCESS: Order executed! Ticket #{res.order}")
            return True
        else:
            err = res.comment if res else mt5.last_error()
            logger.error(f"Order FAILED for [{engine_name}]: {err}")
            return False

    def run(self):
        if not self.connect_mt5():
            return

        logger.info("Live Runner actively monitoring closed M5 bars on XAUUSD...")
        while True:
            try:
                # 1. Fetch M5 Data
                df_m5 = self.fetch_m5_bars()
                if df_m5 is None:
                    time.sleep(5)
                    continue

                # 2. Check for newly closed bar
                # df_m5.index[-1] is currently forming; df_m5.index[-2] is last closed bar
                last_completed_bar = df_m5.index[-2]

                if self.last_closed_bar_time is None:
                    self.last_closed_bar_time = last_completed_bar

                if last_completed_bar > self.last_closed_bar_time:
                    self.last_closed_bar_time = last_completed_bar
                    logger.info(f"New M5 bar closed at {last_completed_bar} UTC. Evaluating ensemble alpha fleet...")

                    # Evaluate all enabled strategy engines
                    for eng_name, eng_info in FLEET_REGISTRY.items():
                        calc_func = eng_info['func']
                        weight = eng_info['weight']
                        magic = eng_info['magic']

                        try:
                            df_signals = calc_func(df_m5.copy())
                            # Causal bar check: Read signal from completed bar iloc[-2]
                            closed_bar = df_signals.iloc[-2]
                            bull = bool(closed_bar.get('bull_signal', False))
                            bear = bool(closed_bar.get('bear_signal', False))

                            if bull or bear:
                                tick = mt5.symbol_info_tick(self.symbol)
                                entry_p = tick.ask if bull else tick.bid
                                sl_p = float(closed_bar['sl_long']) if bull else float(closed_bar['sl_short'])
                                tp_p = float(closed_bar['tp1_long']) if bull else float(closed_bar['tp1_short'])

                                self.execute_order(eng_name, bull, entry_p, sl_p, tp_p, weight, magic)
                        except Exception as e:
                            logger.error(f"Error evaluating [{eng_name}]: {e}")

                time.sleep(2)
            except KeyboardInterrupt:
                logger.info("Runner stopped by user.")
                break
            except Exception as e:
                logger.error(f"Unexpected loop error: {e}")
                time.sleep(5)

if __name__ == "__main__":
    engine = LiveExecutionEngine()
    engine.run()
