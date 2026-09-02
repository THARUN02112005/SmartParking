import { getDb } from '../database.js';
import { SlotWithZone, SlotScore, AIRecommendation } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

const ENTRANCE = { x: 5, y: 15 };

export class AIRecommendationService {
  analyzeSlots(vehicleType: string, availableSlots: SlotWithZone[]): SlotScore[] {
    const db = getDb();
    const allSlots = db.prepare(`
      SELECT s.*, z.name as zoneName FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
    `).all() as SlotWithZone[];

    const occupiedSlots = allSlots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED');
    const totalSlots = allSlots.length;

    const scoredSlots: SlotScore[] = availableSlots.map(slot => {
      let score = 50;
      const reasons: string[] = [];

      const distToEntrance = Math.sqrt(
        Math.pow(slot.positionX - ENTRANCE.x, 2) + Math.pow(slot.positionY - ENTRANCE.y, 2)
      );
      const maxDist = Math.sqrt(Math.pow(30, 2) + Math.pow(20, 2));
      const distScore = Math.max(0, 30 - (distToEntrance / maxDist) * 30);
      score += distScore;
      if (distScore > 20) reasons.push('Close to entrance');

      if (vehicleType === 'EV_CAR' || vehicleType === 'EV_BIKE') {
        if (slot.slotType === 'EV') {
          score += 25;
          reasons.push('EV charging available');
        }
      } else if (vehicleType === 'CAR') {
        if (slot.slotType === 'STANDARD' || slot.slotType === 'COMPACT') {
          score += 10;
          reasons.push('Compatible vehicle type');
        }
      } else if (vehicleType === 'BIKE') {
        if (slot.slotType === 'COMPACT' || slot.slotType === 'STANDARD') {
          score += 10;
          reasons.push('Space-efficient slot');
        }
      }

      const nearbyOccupied = occupiedSlots.filter(o => {
        const dist = Math.sqrt(Math.pow(o.positionX - slot.positionX, 2) + Math.pow(o.positionY - slot.positionY, 2));
        return dist < 5;
      }).length;
      const congestionPenalty = nearbyOccupied * 5;
      score -= congestionPenalty;
      if (congestionPenalty === 0) reasons.push('Low congestion area');
      else if (congestionPenalty <= 5) reasons.push('Moderate congestion');

      if (slot.priority > 0) {
        score += slot.priority * 3;
        reasons.push(`Priority level ${slot.priority}`);
      }

      const occupancyRate = totalSlots > 0 ? occupiedSlots.length / totalSlots : 0;
      if (occupancyRate > 0.8) {
        if (slot.priority >= 2) {
          score += 15;
          reasons.push('High demand - prioritizing high priority');
        }
      }

      score = Math.min(100, Math.max(0, score));

      return {
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        score: Math.round(score * 100) / 100,
        reasons,
      };
    });

    scoredSlots.sort((a, b) => b.score - a.score);
    return scoredSlots;
  }

  getRecommendation(vehicleId: string, vehicleType: string): { slot: SlotWithZone; score: SlotScore; reason: string } | null {
    const db = getDb();

    const availableSlots = db.prepare(`
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      WHERE s.status = 'AVAILABLE'
    `).all() as SlotWithZone[];

    if (availableSlots.length === 0) return null;

    const scoredSlots = this.analyzeSlots(vehicleType, availableSlots);
    if (scoredSlots.length === 0) return null;

    const best = scoredSlots[0];
    const slot = availableSlots.find(s => s.id === best.slotId)!;

    const recommendationId = uuidv4();
    const reason = best.reasons.join('; ');

    db.prepare(`
      INSERT INTO ai_recommendations (id, vehicleId, recommendedSlot, recommendationScore, reason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recommendationId, vehicleId, best.slotId, best.score, reason, new Date().toISOString());

    return { slot, score: best, reason };
  }

  getRecommendationExplanation(recommendation: { score: SlotScore; reason: string }): string {
    const { score, reason } = recommendation;
    return `Recommended slot ${score.slotNumber} with confidence score ${score.score}%. Reasons: ${reason}`;
  }
}

export const aiRecommendationService = new AIRecommendationService();
