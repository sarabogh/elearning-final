const CalendarEvent = require('../models/CalendarEvent');

const listEvents = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = { user: req.user.id };

    if (start || end) {
      filter.startAt = {};
      if (start) filter.startAt.$gte = new Date(start);
      if (end) filter.startAt.$lte = new Date(end);
    }

    const events = await CalendarEvent.find(filter).sort({ startAt: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, notes = '', startAt, endAt = null, color = '#2f855a' } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!startAt) {
      return res.status(400).json({ message: 'startAt is required' });
    }

    const event = await CalendarEvent.create({
      user: req.user.id,
      title: String(title).trim(),
      notes,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      color
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, notes, startAt, endAt, color } = req.body;

    if (title !== undefined) event.title = String(title).trim();
    if (notes !== undefined) event.notes = notes;
    if (startAt !== undefined) event.startAt = new Date(startAt);
    if (endAt !== undefined) event.endAt = endAt ? new Date(endAt) : null;
    if (color !== undefined) event.color = color;
    event.updatedAt = new Date();

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
