import api from './api';

export const analyzeIssue = async (issueId) => {
  if (import.meta.env.PROD) {
    await new Promise(r => setTimeout(r, 2000));
    return {
      data: {
        analysis: {
          diagnosis: "Based on typical machine behavior, the reported symptoms suggest a failure in the primary filtration or hydraulic delivery system.",
          urgencyAssessment: "HIGH",
          estimatedHours: 3.5,
          safetyWarning: "Ensure the equipment is fully locked out and hydraulic pressure is relieved before proceeding.",
          procedure: [
            "Lock out / tag out the asset.",
            "Relieve system pressure completely.",
            "Remove the filter housing and inspect for metal shavings.",
            "Replace the filter element with a new OEM part.",
            "Top up fluids and perform a pressure test."
          ],
          parts: [
            {
              name: "Hydraulic Filter Element",
              partNumber: "HF-OEM-100",
              qty: 1,
              unit: "pcs",
              isOEM: true,
              estimatedCost: 1200,
              currency: "MVR",
              reason: "Required to clear the obstruction.",
              inInventory: false
            },
            {
              name: "Hydraulic Fluid AW-46",
              qty: 1,
              unit: "pail",
              isOEM: false,
              estimatedCost: 950,
              currency: "MVR",
              reason: "Top up required after filter change.",
              inInventory: true
            }
          ],
          preventiveNote: "Recommend checking fluid contamination levels every 250 hours to prevent recurrence."
        }
      }
    };
  }
  return api.post('/ai/analyze-issue', { issueId });
};

export const getDailyBrief = async () => {
  if (import.meta.env.PROD) {
    await new Promise(r => setTimeout(r, 1500));
    return {
      data: {
        brief: "Good morning. Overall fleet availability is at 88%. There are 2 pending 'CRITICAL' issues that require immediate attention. Procurement has 4 parts requests awaiting approval. Weather is optimal for outdoor logistics."
      }
    };
  }
  return api.post('/ai/daily-brief', {});
};

export const getAssetHealth = async (assetId) => {
  if (import.meta.env.PROD) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      data: {
        health: {
          score: 82,
          status: "Good",
          predictedFailures: ["Minor wear on undercarriage rollers"],
          maintenanceRecommendations: ["Schedule inspection of rollers during next standard PM."]
        }
      }
    };
  }
  return api.post('/ai/asset-health', { assetId });
};

let _statusPromise = null;
export const getAiProviderStatus = () => {
  if (import.meta.env.PROD) {
    return Promise.resolve({ enabled: true, provider: 'mock', label: 'Vercel Mock AI' });
  }
  if (!_statusPromise) {
    _statusPromise = api.get('/ai/status')
      .then(r => r.data)
      .catch(() => ({ enabled: false, provider: null, label: 'AI' }));
  }
  return _statusPromise;
};
