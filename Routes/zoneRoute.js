const express = require("express")
// const multer = require("multer");
const {createZone,deleteZone,modifyZone,getZone,getZones,getParkings,getCityZones} = require("../Controllers/zoneController")
const router = express.Router()

// function createStorage() {
//     const storage = multer.diskStorage({
//       destination: (req, file, cb) => {
//         console.log("createdZone", req.createdZone)
//         console.log("createdZone file", file)
//         const zoneType = req.createdZone.zoneType;
//         const folder = zoneType === 'Parking' ? './public/parkings' : './public/cities';
//         cb(null, folder);
//       },
//       filename: (req, file, cb) => {
//         console.log("createdZone", req.createdZone)
//         console.log("createdZone file", file)
//         const zoneId = req.createdZone._id;
//         const fileExtension = file.originalname.slice(file.originalname.lastIndexOf("."));
//         cb(null, zoneId + fileExtension);
//       }
//     });
  
//     return storage;
// }
// const upload = multer({ storage: createStorage() });

router.post("/create", createZone
// ,upload.single('zoneImage'),async (req, res) => {
//     try {
//       const imagePath = req.file.path;
//       console.log(req.file)
      
//       const updatedZone = await Zone.findByIdAndUpdate(req.createdZone._id, { zoneImage: imagePath }, { new: true });
//       res.status(200).send(updatedZone);
//     } catch (e) {
//       res.status(500).send(e);
    // }}
    )
router.post("/delete",deleteZone)
router.post("/modify",modifyZone)
router.post("/details",getZone)
router.post("/",getZones)//parkings and cityZones
router.post("/parkings",getParkings)
router.post("/zones",getCityZones)


module.exports = router