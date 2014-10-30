var sqlite3 = require('sqlite3'),
    async   = require('async'),
    io      = require('socket.io-client'),
    Inotify = require('inotify').Inotify,
    config  = require('./config'),

    socket = io(config.io),
    inotify = new Inotify(),
    processing = false,
    processingTimeout = 0,
    changed = false,
    lastId = 0,
    lastTimestamp = ~~(Date.now() / 1000),
    query = "SELECT id, chatname, author, from_dispname, guid, timestamp, " +
            "type, body_xml, chatmsg_type, edited_timestamp FROM Messages",
    db = new sqlite3.Database(config.skypedb, sqlite3.OPEN_READONLY, function(err) {
      if (err) {
        console.log(err);
        process.exit(-1);
      }
      if (!err) {
        onChange(function(err) {
          if (err) {
            console.log(err);
            process.exit(-1);
          }

          inotify.addWatch({
            path: config.skypedb,
            watch_for: Inotify.IN_MODIFY,
            callback: onChange
          });
        });
      }
    });


function onChange(cb) {
  var data = [];

  changed = true;
  if (processing) return;

  clearTimeout(processingTimeout);

  processingTimeout = setTimeout(function() {
    processing = true;

    async.whilst(
      function() {
        return changed;
      },
      function(cb) {
        var q = query, params = {};
        changed = false;

        if (lastId) {
          q += " WHERE id > $id OR edited_timestamp IS NOT NULL AND edited_timestamp > $time ORDER BY id ASC";
          params.$id = lastId;
          params.$time = lastTimestamp;
        } else {
          q += " ORDER BY id DESC LIMIT 1";
        }

        db.each(q, params, function (err, row) {
          if (err) return cb(err);
          row.guid = row.guid.toString('hex');
          if (lastId) data.push(row);

          lastId = Math.max(lastId, row.id);
          lastTimestamp = Math.max(row.timestamp, row.edited_timestamp ||
              row.timestamp);

        }, cb);
      },
      function(err) {
        if (data.length !== 0) {
          socket.emit('data', data);
        }
        processing = false;
        if (typeof cb === 'function') {
          cb(err);
        }
      }
    );
  }, config.wait);
}
