from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    # Each Profile is linked to one User
    user = models.OneToOneField(User)

    # Information about each profile
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50)
    about = models.TextField(max_length=200, blank=True)
    picture = models.ImageField(upload_to="images", default="defaultProfile.png", blank=True)

    # Each Profile can have many followers
    following = models.ManyToManyField("Profile", symmetrical=False, related_name="followed_by")

    # TODO Additional features that we would like to implement in our 3rd sprint
    # We initially will set all users to be premium
    premium = models.BooleanField(default=True)
    # The remaining quota for users
    space_left = models.PositiveIntegerField(default=0)

    def __unicode__(self):
        return self.first_name + ' ' + self.last_name


class AsmFile(models.Model):
    # File itself where user can both up/download file
    file = models.TextField()
    name = models.CharField(max_length=50, default="Untitled")
    created_date = models.DateTimeField()
    last_modified = models.DateTimeField()
    creator = models.ForeignKey(Profile, related_name='created')
    owner = models.ForeignKey(Profile, related_name='owned_by')
    public = models.BooleanField(default=False)
    # By other users
    downloads = models.PositiveIntegerField(default=0)
    favorites = models.ManyToManyField(Profile, related_name='favorite_asm')
    description = models.TextField(default='')
    version = models.CharField(default='0.0.0.0', max_length=20)
    # TODO Additional features that we would like to implement in our 3rd sprint
    # Bugs/feedback from other users

    def __unicode__(self):
        name = 'file name: ' + str(self.name) + '\n'
        lm = 'last modified: ' + str(self.last_modified) + '\n'
        cr = 'created by: ' + str(self.creator.user.email) + '\n'
        o = 'owner: ' + str(self.owner.user.email) + '\n'
        p = 'public: ' + str(self.public) + '\n'
        return name + cd + lm + cr + o + p


class Breakpoint(models.Model):
    line_number = models.PositiveSmallIntegerField(default=0)
    asm_file = models.ForeignKey(AsmFile)
    enabled = models.BooleanField(default=True)

    # Disables or enables the breakpoint
    def toggle(self):
        self.enabled = not self.enabled
        self.save()

    def __unicode__(self):
        bp = 'breakpoint @ line #:' + self.line_number + '\n'
        file = 'in file: ' + self.asm_file.file.name + '\n'
        return bp + file

        # TODO Add watchpoints, this is might not be a model given it is contingent upon the state of main memory.
