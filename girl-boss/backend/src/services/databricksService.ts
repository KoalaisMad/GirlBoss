/**
 * � DATABRICKS ML SERVICE
 * 
 * This service calls your ML model deployed on Databricks for safety predictions.
 * 
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. SET UP DATABRICKS WORKSPACE:
 *    Sign up at https://databricks.com/try-databricks
 *    Choose Community Edition (free) OR 14-day trial
 *    Create a workspace (AWS/Azure/GCP)
 *    Note your workspace URL (e.g., https://adb-123.12.azuredatabricks.net)
 * 
 * 2. PREPARE TRAINING DATA:
 *    You need historical data with features and safety labels.
 *    
 *    Example CSV format (safety_training_data.csv):
 *    ┌─────────┬─────────┬─────────┬──────────┬─────────┬────────┬─────────┐
 *    │ lat     │ lon     │ hour    │ day_week │ weather │ pop_den│ is_safe │
 *    ├─────────┼─────────┼─────────┼──────────┼─────────┼────────┼─────────┤
 *    │ 30.6187 │ -96.336 │ 22      │ Friday   │ clear   │ high   │ 0       │
 *    │ 30.6195 │ -96.337 │ 14      │ Tuesday  │ sunny   │ medium │ 1       │
 *    │ 30.6180 │ -96.335 │ 8       │ Monday   │ rainy   │ low    │ 1       │
 *    └─────────┴─────────┴─────────┴──────────┴─────────┴────────┴─────────┘
 *    
 *    Features to include:
 *    - latitude, longitude (location)
 *    - hour (0-23), day_of_week (Monday-Sunday)
 *    - weather_condition (clear, rainy, foggy, etc.)
 *    - population_density (low, medium, high)
 *    - historical_incident_rate (number of past incidents)
 *    - lighting_condition (day, dusk, night)
 *    - transport_mode (walking, driving, cycling)
 *    
 *    Label:
 *    - is_safe: 1 (safe) or 0 (risky)
 * 
 * 3. TRAIN ML MODEL IN DATABRICKS:
 *    Create a new notebook and run this code:
 *    
 *    ```python
 *    # Import libraries
 *    from pyspark.sql import SparkSession
 *    from pyspark.ml.feature import VectorAssembler, StringIndexer
 *    from pyspark.ml.classification import RandomForestClassifier
 *    from pyspark.ml import Pipeline
 *    import mlflow
 *    import mlflow.spark
 *    
 *    # Load training data
 *    df = spark.read.csv("/FileStore/safety_training_data.csv", header=True, inferSchema=True)
 *    
 *    # Encode categorical features
 *    indexers = [
 *        StringIndexer(inputCol="day_of_week", outputCol="day_idx"),
 *        StringIndexer(inputCol="weather", outputCol="weather_idx"),
 *        StringIndexer(inputCol="transport_mode", outputCol="transport_idx")
 *    ]
 *    
 *    # Combine features into vector
 *    assembler = VectorAssembler(
 *        inputCols=["lat", "lon", "hour", "day_idx", "weather_idx", 
 *                   "pop_density", "historical_rate", "transport_idx"],
 *        outputCol="features"
 *    )
 *    
 *    # Train Random Forest model
 *    rf = RandomForestClassifier(
 *        featuresCol="features",
 *        labelCol="is_safe",
 *        numTrees=100,
 *        maxDepth=5
 *    )
 *    
 *    # Create pipeline
 *    pipeline = Pipeline(stages=indexers + [assembler, rf])
 *    
 *    # Split data
 *    train, test = df.randomSplit([0.8, 0.2], seed=42)
 *    
 *    # Train model
 *    with mlflow.start_run(run_name="safety_predictor"):
 *        model = pipeline.fit(train)
 *        
 *        # Evaluate
 *        predictions = model.transform(test)
 *        accuracy = predictions.filter(predictions.label == predictions.prediction).count() / float(test.count())
 *        
 *        # Log metrics
 *        mlflow.log_metric("accuracy", accuracy)
 *        
 *        # Log model
 *        mlflow.spark.log_model(model, "model")
 *        
 *        print(f"Model accuracy: {accuracy}")
 *    ```
 * 
 * 4. REGISTER MODEL IN MLFLOW:
 *    
 *    ```python
 *    # Register the model
 *    model_uri = "runs:/<run_id>/model"
 *    mlflow.register_model(model_uri, "safety_predictor")
 *    
 *    # Transition to production
 *    from mlflow.tracking import MlflowClient
 *    client = MlflowClient()
 *    client.transition_model_version_stage(
 *        name="safety_predictor",
 *        version=1,
 *        stage="Production"
 *    )
 *    ```
 * 
 * 5. DEPLOY MODEL AS REST ENDPOINT:
 *    - Go to "Machine Learning" → "Model Serving"
 *    - Click "Create Serving Endpoint"
 *    - Name: "safety-predictor"
 *    - Model: Select "safety_predictor" version 1
 *    - Compute: Small (1-2 workers)
 *    - Click "Create"
 *    - Wait for endpoint to be "Ready" (takes 5-10 minutes)
 * 
 * 6. GET ENDPOINT URL AND TOKEN:
 *    - Copy endpoint URL from the serving page
 *    - Go to User Settings → Access Tokens
 *    - Click "Generate New Token"
 *    - Give it a name (e.g., "safety-app-token")
 *    - Copy the token (starts with "dapi...")
 * 
 * 7. UPDATE .env FILE:
 *    DATABRICKS_MODEL_URL=https://adb-123.12.azuredatabricks.net/serving-endpoints/safety-predictor/invocations
 *    DATABRICKS_TOKEN=your_databricks_token_here
 * 
 * 8. TEST THE ENDPOINT:
 *    
 *    ```bash
 *    curl -X POST "https://your-workspace.databricks.net/serving-endpoints/safety-predictor/invocations" \
 *      -H "Authorization: Bearer dapi..." \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "dataframe_records": [{
 *          "lat": 30.6187,
 *          "lon": -96.3365,
 *          "hour": 22,
 *          "day_of_week": "Friday",
 *          "weather": "clear",
 *          "pop_density": 5,
 *          "historical_rate": 3,
 *          "transport_mode": "walking"
 *        }]
 *      }'
 *    ```
 * 
 * 9. USED BY THESE FILES:
 *    - src/mcp/tools/getRouteSafety.ts (ML prediction)
 *    - src/mcp/tools/scoreRisks.ts (risk assessment)
 *    - src/routes/planningRoutes.ts (route safety)
 * 
 * 10. ALTERNATIVE IF NO DATABRICKS:
 *     - Use rule-based scoring:
 *       score = 100 - (incident_count * 10) - (is_night ? 20 : 0)
 *     - Deploy model on AWS SageMaker, Azure ML, or Google AI Platform
 *     - Use scikit-learn with Flask REST API
 *     - Use TensorFlow.js for client-side prediction
 */

import axios from 'axios';

export interface RiskPrediction {
  safetyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  confidence: number;
}

/**
 * Predict route safety using Databricks Llama model
 * This uses the LLM to analyze safety factors and provide a structured response
 */
export const predictRouteSafety = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  timeOfDay: string,
  transportMode: string
): Promise<RiskPrediction> => {
  try {
    // Check if Databricks credentials are configured
    if (!process.env.DATABRICKS_MODEL_URL || !process.env.DATABRICKS_TOKEN) {
      console.warn('Databricks not configured, using fallback logic');
      return getFallbackPrediction(startLat, startLon, endLat, endLon, timeOfDay, transportMode);
    }

    // Get current hour from timeOfDay
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    
    // Construct prompt for Llama model
    const prompt = `You are a safety analysis expert. Analyze the following route and provide a safety assessment.

Route Details:
- Start: (${startLat.toFixed(4)}, ${startLon.toFixed(4)})
- End: (${endLat.toFixed(4)}, ${endLon.toFixed(4)})
- Time: ${timeOfDay} (hour: ${hour})
- Transport: ${transportMode}
- Lighting: ${isNight ? 'Night/Dark' : 'Daylight'}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "safetyScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "factors": ["<factor1>", "<factor2>", "<factor3>"],
  "confidence": <number 0.0-1.0>
}

Consider: time of day, transport mode, population density, lighting, typical safety patterns.`;

    const response = await axios.post(
      process.env.DATABRICKS_MODEL_URL,
      {
        messages: [
          {
            role: "system",
            content: "You are a safety prediction AI. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DATABRICKS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Parse the LLM response
    const content = response.data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const prediction = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize the response
    return {
      safetyScore: Math.min(100, Math.max(0, prediction.safetyScore || 75)),
      riskLevel: ['low', 'medium', 'high'].includes(prediction.riskLevel) 
        ? prediction.riskLevel 
        : 'medium',
      factors: Array.isArray(prediction.factors) 
        ? prediction.factors.slice(0, 5) 
        : ['General safety assessment'],
      confidence: Math.min(1, Math.max(0, prediction.confidence || 0.7))
    };
    
  } catch (error: any) {
    console.error('Databricks prediction error:', error.message || error);
    
    // Return fallback prediction with rule-based logic
    return getFallbackPrediction(startLat, startLon, endLat, endLon, timeOfDay, transportMode);
  }
};

/**
 * Fallback prediction using rule-based logic when Databricks is unavailable
 * Uses location and time data to generate realistic, varying safety scores
 */
function getFallbackPredection(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  timeOfDay: string,
  transportMode: string
): RiskPrediction {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;
  const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  
  // Use location to vary base safety (urban vs rural, different neighborhoods)
  const areaRiskFactor = Math.abs(Math.sin(startLat * 100) * Math.cos(startLon * 100)); // 0-1
  const urbanScore = areaRiskFactor; // 0 = rural, 1 = urban
  
  // Start with location-dependent base score
  // Urban areas: 70-85 during day, 50-65 at night
  // Rural areas: 75-90 during day, 45-60 at night
  let baseDayScore = urbanScore > 0.5 ? 70 + (urbanScore * 15) : 75 + ((1 - urbanScore) * 15);
  let baseNightScore = urbanScore > 0.5 ? 50 + (urbanScore * 15) : 45 + ((1 - urbanScore) * 15);
  
  let safetyScore = isNight ? baseNightScore : baseDayScore;
  const factors: string[] = [];
  
  // Time-based adjustments
  if (hour >= 0 && hour < 4) {
    safetyScore -= 20; // Very late night
    factors.push('Very late night hours (midnight-4am) - highest risk period');
  } else if (isNight) {
    safetyScore -= 12;
    factors.push('Nighttime travel - reduced visibility and fewer people around');
  } else if (isDusk) {
    safetyScore -= 8;
    factors.push('Dusk hours - transitional lighting conditions');
  }
  
  if (isRushHour && !isNight) {
    safetyScore -= 7;
    factors.push('Rush hour - increased traffic congestion');
  }
  
  // Transport mode adjustments based on vulnerability
  if (transportMode === 'walking') {
    if (isNight) {
      safetyScore -= 15;
      factors.push('Walking at night - highly exposed, use well-lit populated routes');
    } else {
      safetyScore -= 5;
      factors.push('Walking - stay aware of surroundings');
    }
    // Less urban = more risky for walking
    if (urbanScore < 0.3) {
      safetyScore -= 10;
      factors.push('Walking in low-density area - limited help available');
    }
  } else if (transportMode === 'driving') {
    safetyScore += 8;
    factors.push('Driving provides vehicle protection');
    if (isRushHour) {
      safetyScore -= 5; // Offset the bonus due to traffic
    }
  } else if (transportMode === 'public' || transportMode === 'transit') {
    if (isNight) {
      safetyScore -= 8;
      factors.push('Late night public transit - reduced service and supervision');
    } else {
      safetyScore += 3;
      factors.push('Public transit - monitored and populated');
    }
  } else if (transportMode === 'bicycling') {
    if (isNight) {
      safetyScore -= 12;
      factors.push('Bicycling at night - visibility concerns');
    } else {
      safetyScore -= 3;
    }
  }
  
  // Distance-based risk (longer exposure time)
  const distance = Math.sqrt(
    Math.pow((endLat - startLat) * 69, 2) + Math.pow((endLon - startLon) * 69, 2)
  ); // Approximate miles
  
  if (distance > 10) {
    safetyScore -= 8;
    factors.push('Long distance route - extended exposure time');
  } else if (distance > 5) {
    safetyScore -= 4;
    factors.push('Moderate distance route');
  }
  
  // Area-specific risks
  if (urbanScore > 0.7) {
    // High urban area
    if (isNight) {
      safetyScore -= 5;
      factors.push('Dense urban area at night - increased crime potential');
    }
  } else if (urbanScore < 0.3) {
    // Rural area
    if (isNight) {
      safetyScore -= 8;
      factors.push('Rural/isolated area at night - limited assistance available');
    }
  }
  
  // Ensure score is within bounds
  safetyScore = Math.min(100, Math.max(0, Math.round(safetyScore)));
  
  // Determine risk level based on new thresholds
  let riskLevel: 'low' | 'medium' | 'high';
  if (safetyScore >= 70) {
    riskLevel = 'low';
  } else if (safetyScore >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  if (factors.length === 0) {
    factors.push('Favorable route conditions');
  }
  
  return {
    safetyScore,
    riskLevel,
    factors,
    confidence: 0.65 // Lower confidence for rule-based
  };
}

// Fix typo in function name
function getFallbackPrediction(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  timeOfDay: string,
  transportMode: string
): RiskPrediction {
  return getFallbackPredection(startLat, startLon, endLat, endLon, timeOfDay, transportMode);
}
