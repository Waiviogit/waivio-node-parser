const mongoose = require('mongoose');

const { Schema } = mongoose;

const GeoObjectSchema = new Schema({
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  country: { type: String },
  province: { type: String },
  regional_district: { type: String },
  name: { type: String, required: true },
  type: { type: String, required: true },
});

GeoObjectSchema.index({ geometry: '2dsphere' });
GeoObjectSchema.index({ 'properties.name': 1, 'properties.type': 1 });

const GeoObjectModel = mongoose.model('geographic_objects', GeoObjectSchema);

module.exports = GeoObjectModel;
