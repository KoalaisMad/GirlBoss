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

export const predictRouteSafety = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  timeOfDay: string,
  transportMode: string
): Promise<RiskPrediction> => {
  try {
    const response = await axios.post(
      process.env.DATABRICKS_MODEL_URL || '',
      {
        dataframe_records: [{
          start_lat: startLat,
          start_lon: startLon,
          end_lat: endLat,
          end_lon: endLon,
          time_of_day: timeOfDay,
          transport_mode: transportMode
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DATABRICKS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const prediction = response.data.predictions[0];
    
    return {
      safetyScore: prediction.safety_score || 75,
      riskLevel: prediction.risk_level || 'medium',
      factors: prediction.risk_factors || [],
      confidence: prediction.confidence || 0.85
    };
  } catch (error) {
    console.error('Databricks prediction error:', error);
    // Return default prediction
    return {
      safetyScore: 75,
      riskLevel: 'medium',
      factors: ['Historical data unavailable'],
      confidence: 0.5
    };
  }
};
