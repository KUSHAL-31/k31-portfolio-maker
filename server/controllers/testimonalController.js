const User = require("../models/Users");
const UserTestimonials = require("../models/UserTestimonials");
const asyncErrorHandler = require("../utility/asyncErrorHandler");
const HandleError = require("../utility/handleError");
const cloudinary = require("cloudinary");


exports.listNewTestimonialByUserId = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { employerName, companyName, image, comment, rating } = req.body;
    if (employerName === undefined || companyName === undefined || rating === undefined) {
        return next(new HandleError("Please fill the mandatory fields", 400));
    }
    let result;
    if (image) {
        result = await cloudinary.v2.uploader.upload(image, {
            folder: "k31portfolios",
        });
    }

    // Find the user's website document
    const testimonialDetails = await UserTestimonials.findOne({ user: userId });
    if (!testimonialDetails) {
        testimonialDetails = new UserTestimonials({ user: userId, testimonials: [] });
    }

    // Create a new testimonial
    const newTestimonial = {
        testimonialId: uuidv4(),
        title,
        description,
        image: result ? { public_id: result.public_id, url: result.secure_url } : "",
        url,
        sourceCode
    };

    // Push the new testimonial into the testimonials array
    testimonialDetails.testimonials.push(newTestimonial);

    // Save the updated document
    await testimonialDetails.save();

    return res.status(201).json({
        success: true,
        message: 'testimonial added successfully!',
        testimonials: testimonialDetails.testimonials
    });
});


exports.editTestimonialByUserId = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { testimonialId, employerName, companyName, image, comment, rating, isImageEdited } = req.body;

    if (!testimonialId || !employerName || !companyName || !rating) {
        return next(new HandleError("Please fill the mandatory fields", 400));
    }

    let result;
    if (image && isImageEdited) {
        result = await cloudinary.uploader.upload(image, {
            folder: "k31portfolios",
        });
    }

    // Find the user's testimonial details document
    const testimonialDetails = await UserTestimonials.findOne({ user: userId });

    if (!testimonialDetails) {
        return next(new HandleError("User testimonial details not found", 404));
    }

    // Find the testimonial by testimonialId and update it
    const testimonialIndex = testimonialDetails.testimonials.findIndex(t => t.testimonialId === testimonialId);

    if (testimonialIndex === -1) {
        return next(new HandleError("testimonial not found", 404));
    }

    // Delete previous image from Cloudinary if new image is uploaded
    if (isImageEdited && testimonialDetails.testimonials[testimonialIndex].image.public_id) {
        await cloudinary.uploader.destroy(testimonialDetails.testimonials[testimonialIndex].image.public_id);
    }

    testimonialDetails.testimonials[testimonialIndex] = {
        ...testimonialDetails.testimonials[testimonialIndex],
        employerName,
        companyName,
        image: { public_id: result.public_id, url: result.secure_url },
        rating,
    };

    // Save the updated document
    await testimonialDetails.save();

    res.status(200).json({
        success: true,
        message: 'testimonial updated successfully!',
        testimonials: testimonialDetails.testimonials
    });
});


exports.deletetestimonialByUserId = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { testimonialId } = req.body;

    if (!testimonialId) {
        return next(new HandleError("Something went wrong", 400));
    }

    // Find the user's testimonial details document
    const testimonialDetails = await UserTestimonials.findOne({ user: userId });

    if (!testimonialDetails) {
        return next(new HandleError("testimonial not found", 404));
    }

    // Find the index of the testimonial to delete
    const testimonialIndex = testimonialDetails.testimonials.findIndex(p => p.testimonialId === testimonialId);

    if (testimonialIndex === -1) {
        return next(new HandleError("testimonial not found", 404));
    }

    // Delete the previous image from Cloudinary if it exists
    if (testimonialDetails.testimonials[testimonialIndex].image && testimonialDetails.testimonials[testimonialIndex].image.public_id) {
        await cloudinary.uploader.destroy(testimonialDetails.testimonials[testimonialIndex].image.public_id);
    }

    // Remove the testimonial from the array
    testimonialDetails.testimonials.splice(testimonialIndex, 1);

    // Save the updated document
    await testimonialDetails.save();

    res.status(200).json({
        success: true,
        message: 'testimonial deleted successfully!',
        testimonials: testimonialDetails.testimonials
    });
});


exports.getAlltestimonialsByUserId = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user.id;
    // Find the user's testimonial details document
    const testimonialDetails = await UserTestimonials.findOne({ user: userId });

    if (!testimonialDetails) {
        return next(new HandleError("No testimonials found", 404));
    }

    res.status(200).json({
        success: true,
        message: 'testimonials retrieved successfully!',
        testimonials: testimonialDetails.testimonials
    });
});