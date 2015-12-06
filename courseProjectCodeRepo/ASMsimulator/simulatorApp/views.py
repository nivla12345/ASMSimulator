from django.shortcuts import render, redirect, get_object_or_404
from django.core.urlresolvers import reverse
from django.db import transaction
from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.template import RequestContext

# Needed to manually create HttpResponses or raise an Http404 exception
from django.http import HttpResponse, Http404
from django.core.exceptions import ObjectDoesNotExist

# Decorator to use built-in authentication system
from django.contrib.auth.decorators import login_required

# Used to generate a one-time-use token to verify a user's email address
from django.contrib.auth.tokens import default_token_generator

# Used to send mail from within Django
from django.core.mail import send_mail

# Helper function to guess a MIME type from a file name
from mimetypes import guess_type

from forms import *
from datetime import datetime


@login_required
def home(request):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    context['profile'] = profile
    # displays the most recently modified files first
    fileList = AsmFile.objects.filter(owner=profile).order_by('-last_modified')
    fileListInfo = []
    for file in fileList:
        fileModelForm = FileForm(instance=file)
        fileItem = [file, fileModelForm]
        fileListInfo.append(fileItem)
    context['fileListInfo'] = fileListInfo
    return render(request, "home.html", context)


@login_required
def public(request):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    context['profile'] = profile
    # Get all public ASM files, excluding your own, sorted by most recently modified
    fileList = AsmFile.objects.filter(public=True).exclude(owner=profile).order_by('-last_modified')
    context['fileList'] = fileList
    return render(request, "public.html", context)


@transaction.atomic
def register(request):
    context = dict()
    context['login_form'] = AuthenticationForm()
    context['reset_form'] = ResetForm()
    context['registration_form'] = RegistrationForm()

    # Just display the registration form if this is a GET request.
    if request.method == 'GET':
        return render(request, "login.html", context)

    # If we get here, form was filled
    registration_form = RegistrationForm(request.POST)

    # Validates the form.
    if not registration_form.is_valid():
        context['registration_form'] = registration_form
        return render(request, "login.html", context)

    # If we get here the form data was valid.  Create a Profile and User
    new_user = User.objects.create_user(username=registration_form.cleaned_data['username'],
                                        password=registration_form.cleaned_data['password1'])

    # Mark the user as inactive to prevent login before email confirmation.
    new_user.is_active = False
    new_user.save()

    new_profile = Profile(user=new_user,
                          first_name=registration_form.cleaned_data['first_name'],
                          last_name=registration_form.cleaned_data['last_name'],
                          email=registration_form.cleaned_data['email'])
    new_profile.save()

    # Generate a one-time use token loand an email message body
    token = default_token_generator.make_token(new_user)

    email_body = """
Thank you for registering for the ASM Simulator. Please click the link below to
verify your email address and complete the registration of your account:
  http://%s%s
""" % (request.get_host(),
       reverse('confirm_register', args=(new_user.username, token)))

    send_mail(subject="Verify your email address",
              message=email_body,
              from_email="khd@andrew.cmu.edu",
              recipient_list=[new_profile.email])

    context['email'] = registration_form.cleaned_data['email']
    context['email_body'] = email_body
    return render(request, 'needs-confirmation-register.html', context)


@transaction.atomic()
def reset_password(request):
    context = dict()
    context['login_form'] = AuthenticationForm()
    context['reset_form'] = ResetForm()
    context['registration_form'] = RegistrationForm()

    if request.method == 'GET':
        reset_form = ResetForm()
        context['reset_form'] = reset_form
        return render(request, 'login.html.html', context)

    # If we submitted an email
    reset_form = ResetForm(request.POST)
    if not reset_form.is_valid():
        context['reset_form'] = reset_form
        return render(request, 'login.html', context)
    profile = get_object_or_404(Profile, email=reset_form.cleaned_data['email'])
    user = profile.user
    token = default_token_generator.make_token(user)
    email_body = """
Somebody recently asked to reset your ASM Simulator password.
If this was not you, please change your password immediately.
You may follow this link to change your password to change your password:
  http://%s%s
""" % (request.get_host(),
       reverse('confirm_reset', args=(user.username, token)))

    send_mail(subject="Somebody requested a new password for your ASM Simulator account",
              message=email_body,
              from_email="andrew@cs.cmu.edu",
              recipient_list=[profile.email])
    context['email_body'] = email_body
    return render(request, 'needs-confirmation-reset.html', context)


@transaction.atomic
def confirmed_registration(request, username, token):
    context = dict()
    context['login_form'] = AuthenticationForm()
    context['reset_form'] = ResetForm()
    context['registration_form'] = RegistrationForm()
    user = get_object_or_404(User, username=username)

    # Send 404 error if token is invalid
    if not default_token_generator.check_token(user, token):
        raise Http404

    # Otherwise token was valid, activate the user.
    user.is_active = True
    user.save()

    return render(request, 'confirmed-register.html', context)


# Reach here when user clicks on the token generated
@transaction.atomic
def confirmed_reset(request, username, token):
    context = dict()
    context['login_form'] = AuthenticationForm()
    context['reset_form'] = ResetForm()
    context['registration_form'] = RegistrationForm()
    context['username'] = username
    context['token'] = token
    user = get_object_or_404(User, username=username)

    # Send 404 error if token is invalid
    if not default_token_generator.check_token(user, token):
        raise Http404

    # If we just reached here
    if request.GET:
        context['reset_password_form'] = ResetPasswordForm()
        return render(request, 'confirmed-reset.html', context)

    # Otherwise post request, so form was filled
    reset_password_form = ResetPasswordForm(request.POST)
    context['reset_password_form'] = reset_password_form
    if not reset_password_form.is_valid():
        return render(request, 'confirmed-reset.html', context)

    # Change their password now
    user.set_password(reset_password_form.cleaned_data['password1'])
    user.save()
    return redirect(reverse('home'))


@login_required
@transaction.atomic
def profile(request):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    context['profile'] = profile
    context['following_list'] = profile.following.all()
    context['followed_by_list'] = profile.following.all()
    return render(request, "profile.html", context)


@login_required
@transaction.atomic
def view_profile(request, id):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    target_profile = get_object_or_404(Profile, id=id)
    if target_profile == profile:
        return redirect(reverse(edit_profile))
    context['profile'] = target_profile
    context['following_list'] = target_profile.following.all()
    context['followed_by_list'] = target_profile.followed_by.all()
    context['currentProfile'] = profile
    context['fileList'] = AsmFile.objects.all().filter(owner=target_profile).filter(public=True).order_by(
        '-last_modified')
    return render(request, "view-profile.html", context)


@login_required
@transaction.atomic
def edit_profile(request):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    context['profile'] = profile
    context['following_list'] = profile.following.all()
    context['followed_by_list'] = profile.followed_by.all()

    context['password_form'] = PasswordForm()
    context['profile_form'] = ProfileForm(instance=profile)
    context['fileList'] = profile.favorite_asm.all().order_by('-last_modified')
    # If we just got here, creates form from existing entry
    if request.method == 'GET':
        return render(request, 'profile.html', context)

    profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
    context['profile_form'] = profile_form

    if not profile_form.is_valid():
        return render(request, 'profile.html', context)

    # If method is POST, get form data to update the model
    profile_form.save()

    return render(request, 'profile.html', context)


@login_required
@transaction.atomic
def edit_password(request):
    context = dict()
    profile = get_object_or_404(Profile, user=request.user)
    context['profile'] = profile
    context['password_form'] = PasswordForm()
    context['profile_form'] = ProfileForm(instance=profile)

    # If we just got here, creates form from existing entry
    if request.method == 'GET':
        return render(request, 'edit_profile.html', context)

    # If method is POST, get form data to update the model
    password_form = PasswordForm(request.POST)
    context['password_form'] = password_form

    # Save if no errors
    if not password_form.is_valid():
        return render(request, 'edit_profile.html', context)

    # Change password if they have the right current password
    user = request.user
    if user.check_password(password_form.cleaned_data['password']):
        user.set_password(password_form.cleaned_data['password1'])
        user.save()
    else:
        context['errors'] = "Current password is wrong."
    return render(request, 'profile.html', context)


@login_required
def get_photo(request, id):
    profile = get_object_or_404(Profile, id=id)
    if not profile.picture:
        raise Http404
    content_type = guess_type(profile.picture.name)
    return HttpResponse(profile.picture, content_type=content_type)


@login_required
@transaction.atomic
def follow(request, id):
    profile = get_object_or_404(Profile, user=request.user)
    target_profile = get_object_or_404(Profile, id=id)
    profile.following.add(target_profile)
    profile.save()
    return redirect(request.META.get("HTTP_REFERER"))


@login_required
@transaction.atomic
def unfollow(request, id):
    profile = get_object_or_404(Profile, user=request.user)
    target_profile = get_object_or_404(Profile, id=id)
    profile.following.remove(target_profile)
    profile.save()
    return redirect(request.META.get("HTTP_REFERER"))


@login_required
@transaction.atomic
def favorite(request, id):
    profile = get_object_or_404(Profile, user=request.user)
    target_file = get_object_or_404(AsmFile, id=id)
    target_file.favorites.add(profile)
    target_file.save()
    return redirect(request.META.get("HTTP_REFERER"))


@login_required
@transaction.atomic
def unfavorite(request, id):
    profile = get_object_or_404(Profile, user=request.user)
    target_file = get_object_or_404(AsmFile, id=id)
    target_file.favorites.remove(profile)
    target_file.save()
    return redirect(request.META.get("HTTP_REFERER"))


@login_required
@transaction.atomic
def createProgram(request, id):
    profile = get_object_or_404(Profile, id=id)
    if request.GET:
        return redirect(request.META.get("HTTP_REFERER"))
    if 'program_name' in request.POST:
        name = request.POST['program_name']
    else:
        name = "Untitled"
    if 'description' in request.POST:
        desc = request.POST['description']
    else:
        desc = "No description entered"

    new_file = AsmFile(file="", name=name, description=desc,
                       creator=profile, owner=profile,
                       created_date=datetime.now(),
                       last_modified=datetime.now())
    new_file.save()
    return redirect(reverse('home'))


@login_required
@transaction.atomic
def simulateProgram(request, id):
    context = {}
    profile = get_object_or_404(Profile,user=request.user)
    program = get_object_or_404(AsmFile,id=id)
    # Security
    if not (profile == program.owner or program.public):
        return redirect(reverse('home'))
    context['profile'] = profile
    context['program'] = program

    return render(request, "program.html", context)


@login_required
@transaction.atomic
def deleteProgram(request, id):
    try:
        program_to_delete = get_object_or_404(AsmFile, id=id)
        program_to_delete.delete()
    except ObjectDoesNotExist:
        return redirect(request.META.get("HTTP_REFERER"))

    return redirect(reverse('home'))


@login_required
@transaction.atomic
def editProgram(request, id):
    program_to_edit = get_object_or_404(AsmFile, id=id)
    if request.method == 'GET':
        return redirect(reverse('home'))

    ASM_form = FileForm(request.POST, instance=program_to_edit)
    if not ASM_form.is_valid():
        return redirect(reverse('home'))
    ASM_form.save()
    return redirect(reverse('home'))


@login_required
@transaction.atomic
def saveProgram(request, id):
    context = {}
    data = request.POST['data']
    program = get_object_or_404(AsmFile, id=id)
    program.file = data
    program.last_modified = datetime.now()
    program.save()
    return render(request, "program.html", context)
