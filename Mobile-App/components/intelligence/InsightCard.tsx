import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OwnerRecommendation, VehicleIntelligenceInsight } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  insight: VehicleIntelligenceInsight;
}

function scoreColor(score: number) {
  if (score >= 70) return '#FF5D73';
  if (score >= 45) return '#E8C547';
  return FLEET_COLORS.green;
}

export function InsightCard({ insight }: Props) {
  const riskColor = scoreColor(insight.tripRiskScore);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.vehicleName}>{insight.vehicleName}</Text>
          <Text style={styles.liveSummary}>{insight.liveSummary}</Text>
        </View>
        <View style={[styles.riskPill, { backgroundColor: `${riskColor}22`, borderColor: `${riskColor}55` }]}>
          <Ionicons name="sparkles-outline" size={14} color={riskColor} />
          <Text style={[styles.riskText, { color: riskColor }]}>{insight.tripRiskScore}/100</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Score label="Suspicious" value={insight.suspiciousMovementScore} />
        <Score label="Anomaly" value={insight.anomalyScore} />
        <Score label="Pattern" value={insight.driverPatternScore} />
      </View>

      <Text style={styles.aiSummary}>{insight.aiSummary}</Text>

      <View style={styles.forecastCard}>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>Forecast</Text>
          <Text style={styles.forecastValue}>{insight.forecast.likelyActiveWindow}</Text>
        </View>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>Expected distance</Text>
          <Text style={styles.forecastValue}>{insight.forecast.expectedDistanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.forecastItem}>
          <Text style={styles.forecastLabel}>Confidence</Text>
          <Text style={styles.forecastValue}>{insight.forecast.confidence}%</Text>
        </View>
      </View>

      <View style={styles.predictionCard}>
        <Text style={styles.predictionTitle}>Geofence prediction</Text>
        <Text style={styles.predictionBody}>
          {insight.geofencePrediction.estimatedMinutesToBreach != null
            ? `${Math.round(insight.geofencePrediction.breachProbability * 100)}% breach probability in about ${insight.geofencePrediction.estimatedMinutesToBreach} minute${insight.geofencePrediction.estimatedMinutesToBreach === 1 ? '' : 's'}.`
            : `${Math.round(insight.geofencePrediction.breachProbability * 100)}% breach probability. No immediate boundary crossing predicted.`}
        </Text>
      </View>

      {insight.predictiveAlert ? (
        <View style={styles.predictiveAlert}>
          <Ionicons name="flash-outline" size={15} color="#FF5D73" />
          <Text style={styles.predictiveText}>{insight.predictiveAlert}</Text>
        </View>
      ) : null}

      <View style={styles.recommendations}>
        <Text style={styles.recommendationsTitle}>Decision support</Text>
        {insight.recommendations.map((recommendation) => (
          <RecommendationRow key={recommendation.id} recommendation={recommendation} />
        ))}
      </View>
    </View>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  const color = scoreColor(value);
  return (
    <View style={styles.scoreCard}>
      <Text style={[styles.scoreValue, { color }]}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

function RecommendationRow({ recommendation }: { recommendation: OwnerRecommendation }) {
  const color = recommendation.priority === 'high' ? '#FF5D73' : recommendation.priority === 'medium' ? '#E8C547' : FLEET_COLORS.green;
  return (
    <View style={styles.recommendationRow}>
      <View style={[styles.priorityDot, { backgroundColor: color }]} />
      <View style={styles.recommendationBody}>
        <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
        <Text style={styles.recommendationText}>{recommendation.action}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  vehicleName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  liveSummary: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 240,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.background,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
  aiSummary: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  forecastCard: {
    flexDirection: 'row',
    gap: 8,
  },
  forecastItem: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.background,
    padding: 10,
    gap: 3,
  },
  forecastLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
  },
  forecastValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  predictionCard: {
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.background,
    padding: 12,
    gap: 4,
  },
  predictionTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  predictionBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  predictiveAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FF5D7320',
    borderWidth: 1,
    borderColor: '#FF5D7355',
  },
  predictiveText: {
    color: '#FFB7C3',
    fontSize: 12,
    flex: 1,
  },
  recommendations: {
    gap: 8,
  },
  recommendationsTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  recommendationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  recommendationBody: {
    flex: 1,
    gap: 2,
  },
  recommendationTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
