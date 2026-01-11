import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleCameras = [
  // London, UK area
  { latitude: 51.5074, longitude: -0.1278, type: 'FIXED_SPEED', speedLimit: 30 },
  { latitude: 51.5155, longitude: -0.1257, type: 'RED_LIGHT', speedLimit: null },
  { latitude: 51.5033, longitude: -0.1195, type: 'AVERAGE_SPEED', speedLimit: 40 },
  { latitude: 51.5145, longitude: -0.0905, type: 'FIXED_SPEED', speedLimit: 20 },
  { latitude: 51.4975, longitude: -0.1357, type: 'FIXED_SPEED', speedLimit: 30 },
  
  // New York, USA area
  { latitude: 40.7128, longitude: -74.0060, type: 'RED_LIGHT', speedLimit: null },
  { latitude: 40.7589, longitude: -73.9851, type: 'FIXED_SPEED', speedLimit: 25 },
  { latitude: 40.7614, longitude: -73.9776, type: 'FIXED_SPEED', speedLimit: 35 },
  { latitude: 40.7489, longitude: -73.9680, type: 'RED_LIGHT', speedLimit: null },
  { latitude: 40.7282, longitude: -73.9942, type: 'AVERAGE_SPEED', speedLimit: 30 },
  
  // Los Angeles, USA area
  { latitude: 34.0522, longitude: -118.2437, type: 'FIXED_SPEED', speedLimit: 35 },
  { latitude: 34.0689, longitude: -118.2507, type: 'RED_LIGHT', speedLimit: null },
  { latitude: 34.0407, longitude: -118.2468, type: 'FIXED_SPEED', speedLimit: 25 },
  { latitude: 34.0195, longitude: -118.4912, type: 'AVERAGE_SPEED', speedLimit: 45 },
  
  // Sydney, Australia area
  { latitude: -33.8688, longitude: 151.2093, type: 'FIXED_SPEED', speedLimit: 50 },
  { latitude: -33.8567, longitude: 151.2153, type: 'RED_LIGHT', speedLimit: null },
  { latitude: -33.8650, longitude: 151.2094, type: 'AVERAGE_SPEED', speedLimit: 60 },
  
  // Berlin, Germany area
  { latitude: 52.5200, longitude: 13.4050, type: 'FIXED_SPEED', speedLimit: 50 },
  { latitude: 52.5167, longitude: 13.3889, type: 'RED_LIGHT', speedLimit: null },
  { latitude: 52.5244, longitude: 13.4105, type: 'AVERAGE_SPEED', speedLimit: 60 },
];

async function main() {
  console.log('Seeding database...');

  for (const camera of sampleCameras) {
    await prisma.speedCamera.create({
      data: {
        ...camera,
        type: camera.type as any,
      }
    });
  }

  console.log(`Seeded ${sampleCameras.length} speed cameras`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
