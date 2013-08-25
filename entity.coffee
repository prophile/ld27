World = do ->
  objects = []

  add: (object) ->
    object.doAttach()
    objects.push object
  del: (object) ->
    object.doDetach()
    objects = obj for obj in objects when obj isnt object
  all: (objects, callback) ->
    callback(obj) for obj in objects
  select: (callback) ->
    [best, bestScore] = [null, 0]
    for obj in objects
      result = callback(obj)
      if result? and result < bestScore
        [best, bestScore] = [obj, result]
    best


class BaseEntity
  doJump: ->
  doMoveLeft: ->
  doMoveRight: ->
  doTick: ->
  doGrab: ->
  doAttach: ->
  doDetach: ->
  canGrab: -> false
  hasCargo: -> false
  collideInto: ->
  doHitGoal: ->
  getBase: -> this
  isPlayer: -> false
  getFacing: -> "right"

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
  canGrab: -> @next.canGrab()
  collideInto: (other, clear) -> @next.collideInto(other, clear)
  doHitGoal: -> @next.doHitGoal()
  getBase: -> @next.getBase()
  hasCargo: -> @next.hasCargo()
  isPlayer: -> @next.isPlayer()
  getFacing: -> @next.getFacing()

class PhysicsEntityAdapter extends EntityAdapter
  constructor: (@body, @next) ->

  getBody: -> @body
  getPosition: -> @body.GetWorldCentre()
  getRotation: -> @body.GetAngle()

class ControlAdapter extends EntityAdapter
  constructor: (@next) ->

  doAttach: ->
    Input.hold('move_left', (en) => @doMoveLeft(en))
    Input.hold('move_right', (en) => @doMoveRight(en))
    Input.press('move_up', => @doJump())
    @next.doAttach()

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

class GrabAdapter extends EntityAdapter
  constructor: (@next) ->
    @current = null

  hasCargo: -> @current?

  doGrab: ->
    if @hasCargo()
      @_grabCargo()
    else
      @_dropCargo

  _dropCargo: ->
    [target, joint] = @current
    @body.GetWorld().DestroyJoint(joint)
    @current = null

  _selectTarget: ->
    centre = @getPosition()
    World.select (potential) ->
      centrePotential = potential.getPosition()
      distance = (Math.abs(centre.x - centrePotential.x) +
                  Math.abs(centre.y - centrePotential.y))
      return false if distance > 1000000
      return distance

  _grabCargo: ->
    target = @_selectTarget()
    body = @getBody()
    targetBody = target.getBody()
    srcCentre = body.GetWorldCenter()
    dstCentre = targetBody.GetWorldCenter()
    anchor = new Box2D.Common.Math.b2Vec2(0.5*(srcCentre.x + dstCentre.x),
                                          0.5*(srcCentre.y + dstCentre.y))
    def = new Box2D.Dynamics.Joints.b2WeldJointDef
    def.Initialize(body, targetBody, anchor)
    @current = [target, body.GetWorld().CreateJoint(def)]

class GrabbableAdapter extends EntityAdapter
  canGrab: -> true

class PoisonAdapter extends EntityAdapter
  collideInto: (entity) ->
    @_endGame() if entity.isPlayer()

  _endGame: ->
    throw "Not yet implemented."

class ScoreAdapter extends EntityAdapter
  doHitGoal: ->
    throw "Not yet implemented."

class RotateWithWorldAdapter extends EntityAdapter
  doTick: ->
    body = @getBody()
    physics = body.GetWorld().UserData
    rotation = physics.getRotation()
    body.SetAngle(rot * -(Math.PI / 180))
    @next.doTick()

class SpriteAdapter extends EntityAdapter
  constructor: (@stage, @sprite, @next) ->

  doTick: ->
    pos = @getPosition()
    @sprite.position = new PIXI.Point(pos.x, pos.y)
    @sprite.rotation = @getRotation()
    @next.doTick()

  doAttach: ->
    @stage.addChild @sprite
    @next.doAttach()

  doDetach: ->
    @stage.removeChild @sprite
    @next.doDetach()

@World = World
@BaseEntity = BaseEntity
@PhysicsEntityAdapter = PhysicsEntityAdapter
@ControlAdapter = ControlAdapter
@LateralMovementAdapter = LateralMovementAdapter
@JumpSpacingAdapter = JumpSpacingAdapter
@GrabAdapter = GrabAdapter
@GrabbableAdapter = GrabbableAdapter
@PoisonAdapter = PoisonAdapter
@ScoreAdapter = ScoreAdapter
@RotateWithWorldAdapter = RotateWithWorldAdapter
@SpriteAdapter = SpriteAdapter
@JumpAdapter = JumpAdapter
