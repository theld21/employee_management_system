// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("fullstack-app");


// {
//     "_id": {
//       "$oid": "67fd261beaa949794ef689fa"
//     },
//     "user": {
//       "$oid": "67f7fa42844c28e8e8cf6be4"
//     },
//     "date": {
//       "$date": "2025-04-14T00:00:00Z"
//     },
//     "checkIn": {
//       "time": {
//         "$date": "2025-04-14T15:13:31.639Z"
//       },
//       "note": ""
//     },
//     "totalHours": 0.0091175,
//     "status": "present",
//     "createdAt": {
//       "$date": "2025-04-14T15:13:31.664Z"
//     },
//     "updatedAt": {
//       "$date": "2025-04-14T15:14:04.470Z"
//     },
//     "__v": 0,
//     "checkOut": {
//       "time": {
//         "$date": "2025-04-14T15:14:04.462Z"
//       },
//       "note": ""
//     }
//   }

// let add more data
db.getCollection("attendances").insertOne({
    user: "67f7fa42844c28e8e8cf6be4",
    date: new Date(),
    checkIn: { time: new Date(
      "2025-04-12T15:13:31.639Z"
    ), note: "" },
    totalHours: 0.0091175,
    status: "present",
    checkOut: { time: new Date(
      "2025-04-12T15:14:04.462Z"
    ), note: "" }
});

db.getCollection("attendances").find({});