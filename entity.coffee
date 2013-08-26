World = do ->
  objects = []

  add: (object) ->
    throw "Cannot add nonexistant object." unless object.getBase()?
    object.doAttach()
    objects.push object
  del: (object) ->
    _.defer ->
      newObjects = []
      target = object.getBase()
      for obj in objects
        continue unless obj?
        if obj.getBase() is target
          obj.doDetach()
        else
          newObjects.push obj
      objects = newObjects
  all: (callback) ->
    callback(obj) for obj in objects
  select: (callback) ->
    [best, bestScore] = [null, Number.POSITIVE_INFINITY]
    for obj in objects
      result = callback(obj)
      if result and result < bestScore
        [best, bestScore] = [obj, result]
    best

$ ->
  tickAll = ->
    World.all (object) ->
      object.doTick()
  setInterval tickAll, 1000 / 60

class BaseEntity
  getBody: -> null
  doJump: ->
  doMoveLeft: ->
  doMoveRight: ->
  doTick: ->
  doGrab: ->
  doAttach: ->
  doDetach: ->
  hasCargo: -> false
  collideInto: ->
  doHitGoal: ->
  getBase: -> this
  getFacing: -> "right"
  doHitWall: ->
  hasTag: (tag) -> false

class EntityAdapter
  constructor: (@next) ->

  getBody: -> @next.getBody()
  doJump: -> @next.doJump()
  doMoveLeft: (en) -> @next.doMoveLeft(en)
  doMoveRight: (en) -> @next.doMoveRight(en)
  doTick: -> @next.doTick()
  doGrab: -> @next.doGrab()
  getPosition: -> @next.getPosition()
  getRotation: -> @next.getRotation()
  doAttach: -> @next.doAttach()
  doDetach: -> @next.doDetach()
  collideInto: (other) -> @next.collideInto(other)
  doHitGoal: -> @next.doHitGoal()
  getBase: -> @next.getBase()
  hasCargo: -> @next.hasCargo()
  getFacing: -> @next.getFacing()
  doHitWall: -> @next.doHitWall()

  seppuku: -> World.del(this)

  hasTag: (tag) -> @next.hasTag(tag)

class FixedLocationAdapter extends EntityAdapter
  constructor: (@x, @y, @rotation, @next) ->

  getPosition: -> x: @x, y: @y
  getRotation: -> @rotation

class PhysicsEntityAdapter extends EntityAdapter
  constructor: (@body, @next) ->

  doDetach: ->
    @body.GetWorld().DestroyBody(@body)
    @next.doDetach()

  getBody: -> @body
  getPosition: -> @body.GetWorldCenter()
  getRotation: -> @body.GetAngle()

class ControlAdapter extends EntityAdapter
  constructor: (@next) ->

  doAttach: ->
    Input.hold('move_left', (en) => @doMoveLeft(en))
    Input.hold('move_right', (en) => @doMoveRight(en))
    Input.press('move_up', => @doJump())
    Input.press('gravityGun', => @doGrab())
    @next.doAttach()

class TagAdapter extends EntityAdapter
  constructor: (@tags, @next) ->

  hasTag: (tag) ->
    return true if tag in @tags
    @next.hasTag(tag)

class LateralMovementAdapter extends EntityAdapter
  constructor: (@next) ->
    @left = false
    @right = false
    @facing = "right"

  doMoveLeft: (en) ->
    @left = en
    @facing = "left" if en
    @next.doMoveLeft(en)

  doMoveRight: (en) ->
    @right = en
    @facing = "right" if en
    @next.doMoveRight(en)

  doTick: ->
    body = @getBody()
    baseSpeed = 0
    baseSpeed -= 1 if @left
    baseSpeed += 1 if @right
    baseSpeed *= Constants.k('movement_speed')
    physics = body.GetWorld().UserData
    [x_, y_] = physics.rotate([baseSpeed, 0])
    body.ApplyForce(new Box2D.Common.Math.b2Vec2(x_, y_),
                    body.GetWorldCenter())
    @next.doTick()

  getFacing: -> @facing

class JumpAdapter extends EntityAdapter
  doJump: ->
    jumpHeight = Constants.k('movement_vertical')
    jumpHeight = Constants.k('movement_vertical_cargo') if @hasCargo()
    body = @getBody()
    physics = body.GetWorld().UserData
    [x_, y_] = physics.rotate([0, -jumpHeight])
    body.ApplyImpulse(new Box2D.Common.Math.b2Vec2(x_, y_),
                      body.GetWorldCenter())
    @next.doJump()

class JumpSpacingAdapter extends EntityAdapter
  constructor: (@next) ->
    @lastJump = unixTime()

  doJump: ->
    currentTime = unixTime()
    timeSince = currentTime - @lastJump
    return unless timeSince > Constants.k('jump_cooldown')
    @lastJump = currentTime
    @next.doJump()

  doHitWall: ->
    @lastJump = Number.NEGATIVE_INFINITY
    @next.doHitWall()

class GrabAdapter extends EntityAdapter
  constructor: (@next) ->
    @current = null

  hasCargo: -> @current?

  doGrab: ->
    if @hasCargo()
      @_dropCargo()
    else
      @_grabCargo()

  _dropCargo: ->
    [target, joint] = @current
    @getBody().GetWorld().DestroyJoint(joint)
    @current = null

  _selectTarget: ->
    centre = @getPosition()
    World.select (potential) ->
      return false unless potential.hasTag('grabbable')
      centrePotential = potential.getPosition()
      distance = (Math.abs(centre.x - centrePotential.x) +
                  Math.abs(centre.y - centrePotential.y))
      return false if distance > 1000000
      return distance

  _grabCargo: ->
    target = @_selectTarget()
    return unless target?
    body = @getBody()
    targetBody = target.getBody()
    lol = targetBody.GetUserData()
    lol["grabbed"] = true;

    targetBody.SetU
    headOffset = [0, -4.2]
    physics = body.GetWorld().UserData
    [headOffX, headOffY] = physics.rotate(headOffset)
    srcCentre = body.GetWorldCenter()
    dstCentre = targetBody.GetWorldCenter()
    # what a hack
    headLocation = new Box2D.Common.Math.b2Vec2(srcCentre.x + headOffX,
                                                srcCentre.y + headOffY)
    targetBody.SetPosition(headLocation)
    def = new Box2D.Dynamics.Joints.b2DistanceJointDef()
    def.Initialize(body, targetBody,
                   headLocation,
                   targetBody.GetWorldCenter())
    def.frequencyHz = Constants.k('lift_frequency')
    def.dampingRatio = Constants.k('lift_damping')
    @current = [target, body.GetWorld().CreateJoint(def)]
    targetBody.SetPosition(dstCentre)

class PoisonAdapter extends EntityAdapter
  constructor: (@callback, @tag, @next) ->

  collideInto: (entity) ->
    @callback(entity) if entity.hasTag(@tag)
    @next.collideInto(entity)

class ScoreAdapter extends EntityAdapter
  constructor: (@callback, @next) ->

  doAttach: ->
    @spawnTime = unixTime()
    @next.doAttach()

  doHitGoal: ->
    currentTime = unixTime()
    age = currentTime - @spawnTime
    body = @getBody()
    if body.GetUserData()["grabbed"]?
      @callback(this) unless age < 0.4


class LimitedLifespanAdapter extends EntityAdapter
  constructor: (@lifespan, @callback, @next) ->

  doAttach: ->
    @spawnTime = unixTime()
    @next.doAttach()

  doTick: ->
    currentTime = unixTime()
    age = currentTime - @spawnTime
    if age > @lifespan and @callback()
      @seppuku()
    @next.doTick()

class RotateWithWorldAdapter extends EntityAdapter
  doTick: ->
    body = @getBody()
    physics = body.GetWorld().UserData
    rotation = physics.getRotation()
    body.SetAngle(rotation * -(Math.PI / 180))
    @next.doTick()

class SpriteAdapter extends EntityAdapter
  constructor: (@stage, @sprite, @next) ->

  doTick: ->
    pos = @getPosition()
    @sprite.position = new PIXI.Point(pos.x * PIXELS_PER_METER,
                                      pos.y * PIXELS_PER_METER)
    @sprite.rotation = @getRotation()
    @next.doTick()

  doAttach: ->
    @stage.addChild @sprite
    @next.doAttach()

  doDetach: ->
    @stage.removeChild @sprite
    @next.doDetach()

class DebugLateralMovementAdapter extends EntityAdapter
  doMoveLeft: (en) ->
    console.log "Moving left" if en
    console.log "Not moving left" if not en
    @next.doMoveLeft(en)

  doMoveRight: (en) ->
    console.log "Moving right" if en
    console.log "Not moving right" if not en
    @next.doMoveRight(en)

  doJump: ->
    console.log "Jumping."
    @next.doJump()

@World = World
@BaseEntity = BaseEntity
@PhysicsEntityAdapter = PhysicsEntityAdapter
@ControlAdapter = ControlAdapter
@LateralMovementAdapter = LateralMovementAdapter
@JumpSpacingAdapter = JumpSpacingAdapter
@GrabAdapter = GrabAdapter
@TagAdapter = TagAdapter
@PoisonAdapter = PoisonAdapter
@ScoreAdapter = ScoreAdapter
@RotateWithWorldAdapter = RotateWithWorldAdapter
@SpriteAdapter = SpriteAdapter
@JumpAdapter = JumpAdapter
@DebugLateralMovementAdapter = DebugLateralMovementAdapter
@FixedLocationAdapter = FixedLocationAdapter
@LimitedLifespanAdapter = LimitedLifespanAdapter

